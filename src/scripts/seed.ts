import { connectDatabase, disconnectDatabase } from '../config/database';
import { CategoryModel } from '../modules/categories/category.model';
import { HymnModel } from '../modules/hymns/hymn.model';
import { SEED_CATEGORIES, SEED_HYMNS } from './seed-data';

async function seed() {
  console.log('--- Starting Database Seeding ---');

  try {
    await connectDatabase();

    // 1. Seed Categories
    console.log('Seeding categories...');
    for (const cat of SEED_CATEGORIES) {
      await CategoryModel.findOneAndUpdate(
        { slug: cat.slug },
        {
          $set: {
            name: cat.name,
            description: cat.description,
            iconName: cat.iconName,
            color: cat.color,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`Inserted/updated ${SEED_CATEGORIES.length} categories.`);

    // 2. Seed Hymns
    console.log('Seeding hymns...');
    for (const hymn of SEED_HYMNS) {
      await HymnModel.findOneAndUpdate(
        { number: hymn.number },
        {
          $set: {
            title: hymn.title,
            alternateTitle: hymn.alternateTitle,
            category: hymn.category,
            author: hymn.author,
            verses: hymn.verses,
            chorus: hymn.chorus,
            tags: hymn.tags,
            meter: hymn.meter,
            tune: hymn.tune,
            key: hymn.key,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`Inserted/updated ${SEED_HYMNS.length} hymns.`);

    // 3. Update category hymn counts
    console.log('Updating category hymn counts...');
    const categories = await CategoryModel.find();
    for (const cat of categories) {
      const count = await HymnModel.countDocuments({
        category: new RegExp(`^${cat.name}$`, 'i'),
      });
      cat.hymnCount = count;
      await cat.save();
    }

    console.log('--- Database Seeding Completed Successfully! ---');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

seed();
