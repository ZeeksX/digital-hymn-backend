import { CategoryModel } from './category.model';
import { HymnModel } from '../hymns/hymn.model';
import { HymnService } from '../hymns/hymn.service';
import { AppError } from '../../shared/utils/api-error';

export class CategoryService {
  static async getCategories() {
    // Dynamically calculate hymn count per category to ensure counts are always accurate
    const counts = await HymnModel.aggregate([
      {
        $group: {
          _id: { $toLower: '$category' },
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map<string, number>();
    for (const item of counts) {
      if (item._id) {
        countMap.set(item._id.toLowerCase(), item.count);
      }
    }

    const categories = await CategoryModel.find().sort({ name: 1 }).lean();

    return categories.map((cat) => {
      const liveCount = countMap.get(cat.name.toLowerCase()) ?? cat.hymnCount ?? 0;
      return {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        hymnCount: liveCount,
        iconName: cat.iconName || 'Music',
        color: cat.color || 'emerald',
      };
    });
  }

  static async getCategoryHymns(slug: string, options: { page?: number; limit?: number; sort?: string }) {
    const category = await CategoryModel.findOne({ slug: slug.toLowerCase() }).lean();
    if (!category) {
      throw AppError.notFound(`Category with slug '${slug}' was not found.`);
    }

    const hymnResult = await HymnService.getHymns({
      category: category.name,
      page: options.page || 1,
      limit: options.limit || 20,
      sort: (options.sort as any) || 'number',
    });

    return {
      category: {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        iconName: category.iconName,
        color: category.color,
      },
      ...hymnResult,
    };
  }
}
