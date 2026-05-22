#!/usr/bin/env node
/**
 * Завантажує фото з Pexels (вільна ліцензія) у assets/images/
 * node scripts/download-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (compatible; RootLeafPortfolio/1.0)';

function pexels(id, w = 640, h = 800) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;
}

const PLANTS = [
  { id: 'monstera', pid: 3642618 },
  { id: 'pothos', pid: 1084199 },
  { id: 'sansevieria', pid: 175026 },
  { id: 'ficus-lyrata', pid: 3828860 },
  { id: 'zz-plant', pid: 1457853 },
  { id: 'peace-lily', pid: 1892832 },
  { id: 'rubber-plant', pid: 3076899 },
  { id: 'aloe-vera', pid: 6208086 },
  { id: 'spider-plant', pid: 1086381 },
  { id: 'philodendron', pid: 3704591 },
  { id: 'calathea', pid: 2132475 },
  { id: 'begonia-maculata', pid: 6597112 },
];

/** Обкладинки статей — сюжет відповідає темі в data/articles.json */
const ARTICLES = [
  { file: 'article-watering.jpg', pid: 6912806 }, // полив кімнатних рослин
  { file: 'article-low-light.jpg', pid: 175026 }, // сансев'єра, мало світла
  { file: 'article-repotting.jpg', pid: 9413788 }, // пересадка, коріння в руках
  { file: 'article-humidity.jpg', pid: 221382 }, // краплі води на листі
  { file: 'article-pet-safe.jpg', pid: 1086381 }, // хлорофітум (pet-friendly)
  { file: 'article-starter.jpg', pid: 14076390 }, // набір рослин на підвіконні
];

/** Hero, about, галерея — інтер'єри та догляд */
const SITE = [
  { file: 'hero.jpg', pid: 29383009, w: 900, h: 1100 }, // вітальня з рослинами
  { file: 'greenhouse.jpg', pid: 16552416, w: 1200, h: 600 }, // теплиця
  { file: 'gallery-1.jpg', pid: 7340487 }, // зелена вітальня
  { file: 'gallery-2.jpg', pid: 6471700 }, // підвісне кашпо
  { file: 'gallery-3.jpg', pid: 7546721 }, // вітальня, світло з вікна
  { file: 'gallery-4.jpg', pid: 14076390 }, // сукуленти на підвіконні
  { file: 'gallery-5.jpg', pid: 1892832 }, // спатифілум
  { file: 'gallery-6.jpg', pid: 5797997 }, // ZZ-рослина в home office
  { file: 'gallery-7.jpg', pid: 1086381 }, // хлорофітум
  { file: 'gallery-8.jpg', pid: 6597112 }, // бегонія
];

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`too small ${dest}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  console.log('OK', path.relative(root, dest), `${Math.round(buf.length / 1024)} KB`);
}

async function main() {
  const only = new Set(process.argv.slice(2));
  const runAll = only.size === 0;
  const runPlants = runAll || only.has('plants');
  const runArticles = runAll || only.has('articles');
  const runSite = runAll || only.has('site');

  if (runPlants) {
    for (const p of PLANTS) {
      await download(pexels(p.pid), path.join(root, 'assets/images/plants', `${p.id}.jpg`));
    }
  }
  if (runArticles) {
    for (const a of ARTICLES) {
      await download(pexels(a.pid, 800, 500), path.join(root, 'assets/images/articles', a.file));
    }
  }
  if (runSite) {
    for (const s of SITE) {
      await download(pexels(s.pid, s.w || 640, s.h || 750), path.join(root, 'assets/images/site', s.file));
    }
  }
  console.log('\nDone — локальні фото в assets/images/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
