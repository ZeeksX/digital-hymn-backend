import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { AppError } from '../../shared/utils/api-error';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../shared/utils/tokens';
import { normalizeEmail } from '../../shared/utils/sanitize';
import { UserModel, IUser } from '../users/user.model';
import { RefreshTokenModel } from './refresh-token.model';
import { UserPreferenceModel } from '../preferences/preference.model';
import { RegisterInput, LoginInput } from './auth.schema';
import { TOKEN_EXPIRY } from '../../config/constants';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export class AuthService {
  private static toSafeUser(user: IUser) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private static async createTokenPair(userId: string, email: string, familyId?: string) {
    const activeFamilyId = familyId || crypto.randomUUID();
    const tokenId = crypto.randomUUID();

    const accessToken = signAccessToken({ userId, email });
    const refreshToken = signRefreshToken({
      userId,
      email,
      familyId: activeFamilyId,
      tokenId,
    });

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN_SECONDS * 1000);

    await RefreshTokenModel.create({
      userId,
      tokenHash,
      familyId: activeFamilyId,
      isRevoked: false,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      familyId: activeFamilyId,
    };
  }

  static async register(input: RegisterInput) {
    const cleanEmail = normalizeEmail(input.email);

    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      throw AppError.conflict('An account with this email address already exists.', {
        email: 'Email address is already in use.',
      });
    }

    const passwordHash = await hashPassword(input.password);

    const user = await UserModel.create({
      name: input.name.trim(),
      email: cleanEmail,
      passwordHash,
      authProvider: 'local',
    });

    // Create default preferences for the user
    await UserPreferenceModel.create({
      userId: user._id,
      theme: 'system',
      defaultTextSize: 'md',
      rememberRecentlyViewed: true,
      keepScreenAwake: false,
      serifLyrics: false,
      showVerseNumbers: true,
    });

    const tokens = await this.createTokenPair(user._id.toString(), user.email);

    return {
      user: this.toSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  static async login(input: LoginInput) {
    const cleanEmail = normalizeEmail(input.email);

    const user = await UserModel.findOne({ email: cleanEmail }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      // Prevent user enumeration: generic error
      throw AppError.unauthorized('Invalid email or password.');
    }

    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    const tokens = await this.createTokenPair(user._id.toString(), user.email);

    return {
      user: this.toSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  static async googleLogin(idToken: string) {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch (err) {
      // Fallback for tests/mocking or invalid token
      throw AppError.badRequest('Invalid or expired Google identity token.');
    }

    if (!payload || !payload.email) {
      throw AppError.badRequest('Google token missing email address.');
    }

    if (!payload.email_verified) {
      throw AppError.badRequest('Google email address must be verified.');
    }

    const cleanEmail = normalizeEmail(payload.email);
    const googleId = payload.sub;
    const name = payload.name || payload.given_name || 'Hymn User';

    let user = await UserModel.findOne({
      $or: [{ googleId }, { email: cleanEmail }],
    });

    if (user) {
      // Safely link Google ID if not yet linked
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = await UserModel.create({
        name,
        email: cleanEmail,
        googleId,
        authProvider: 'google',
      });

      // Default preferences
      await UserPreferenceModel.create({
        userId: user._id,
        theme: 'system',
        defaultTextSize: 'md',
        rememberRecentlyViewed: true,
        keepScreenAwake: false,
        serifLyrics: false,
        showVerseNumbers: true,
      });
    }

    const tokens = await this.createTokenPair(user._id.toString(), user.email);

    return {
      user: this.toSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  static async refresh(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw AppError.unauthorized('Refresh token is required.');
    }

    const decoded = verifyRefreshToken(rawRefreshToken);
    if (!decoded || !decoded.userId || !decoded.familyId) {
      throw AppError.unauthorized('Refresh token is invalid or expired.');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await RefreshTokenModel.findOne({ tokenHash });

    // Reuse detection: If token record not found or is revoked, revoke whole family
    if (!storedToken || storedToken.isRevoked) {
      await RefreshTokenModel.updateMany(
        { familyId: decoded.familyId },
        { isRevoked: true }
      );
      throw AppError.unauthorized(
        'Refresh token reuse detected or token revoked. Please log in again.'
      );
    }

    // Invalidate the used refresh token (rotation)
    storedToken.isRevoked = true;
    await storedToken.save();

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw AppError.unauthorized('User associated with this token no longer exists.');
    }

    // Issue new token pair preserving the familyId
    const tokens = await this.createTokenPair(user._id.toString(), user.email, decoded.familyId);

    return {
      user: this.toSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  static async logout(rawRefreshToken?: string, userId?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshTokenModel.updateOne({ tokenHash }, { isRevoked: true });
    } else if (userId) {
      await RefreshTokenModel.updateMany({ userId }, { isRevoked: true });
    }
  }

  static async getCurrentUser(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found.');
    }

    let preferences = await UserPreferenceModel.findOne({ userId: user._id });
    if (!preferences) {
      preferences = await UserPreferenceModel.create({
        userId: user._id,
        theme: 'system',
        defaultTextSize: 'md',
        rememberRecentlyViewed: true,
        keepScreenAwake: false,
        serifLyrics: false,
        showVerseNumbers: true,
      });
    }

    return {
      user: this.toSafeUser(user),
      preferences: preferences.toJSON(),
    };
  }
}
