export interface StoryCoverInfo {
  bgColor: string;
  textColor: string;
  accentColor: string;
  goldFoil: string;
  spineColor: string;
  imageUrl: string;
  subtitle?: string;
}

export const STORY_COVERS: Record<string, StoryCoverInfo> = {
  // Fairy Tales
  'Cinderella': {
    bgColor: '#0c192c',
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    goldFoil: '#f59e0b',
    spineColor: '#070f1e',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Glass Slipper'
  },
  'Snow White and the Seven Dwarfs': {
    bgColor: '#3f0e15',
    textColor: '#ffffff',
    accentColor: '#f43f5e',
    goldFoil: '#fbbf24',
    spineColor: '#25060b',
    imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Magic Mirror'
  },
  'Rapunzel': {
    bgColor: '#143823',
    textColor: '#ffffff',
    accentColor: '#4ade80',
    goldFoil: '#facc15',
    spineColor: '#0b2315',
    imageUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Golden Tower'
  },
  'Sleeping Beauty': {
    bgColor: '#3b124d',
    textColor: '#ffffff',
    accentColor: '#c084fc',
    goldFoil: '#f59e0b',
    spineColor: '#22082e',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Briar Rose'
  },
  'Beauty and the Beast': {
    bgColor: '#3a2312',
    textColor: '#ffffff',
    accentColor: '#fbbf24',
    goldFoil: '#f59e0b',
    spineColor: '#231307',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Enchanted Rose'
  },
  'The Princess and the Pea': {
    bgColor: '#1e2538',
    textColor: '#ffffff',
    accentColor: '#94a3b8',
    goldFoil: '#34d399',
    spineColor: '#121724',
    imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=80',
    subtitle: 'A Royal Test'
  },

  // Bedtime Classics
  'Goldilocks and the Three Bears': {
    bgColor: '#4a2c0f',
    textColor: '#ffffff',
    accentColor: '#fbbf24',
    goldFoil: '#d97706',
    spineColor: '#2d1805',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Forest Cottage'
  },
  'The Velveteen Rabbit': {
    bgColor: '#3d251e',
    textColor: '#ffffff',
    accentColor: '#fdba74',
    goldFoil: '#f59e0b',
    spineColor: '#24140f',
    imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
    subtitle: 'How Toys Become Real'
  },
  'Little Red Riding Hood': {
    bgColor: '#4c0e17',
    textColor: '#ffffff',
    accentColor: '#f87171',
    goldFoil: '#fbbf24',
    spineColor: '#2c060c',
    imageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&auto=format&fit=crop&q=80',
    subtitle: 'Through the Deep Woods'
  },
  'The Gingerbread Man': {
    bgColor: '#4a2411',
    textColor: '#ffffff',
    accentColor: '#fdba74',
    goldFoil: '#fbbf24',
    spineColor: '#2e1406',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    subtitle: 'Run As Fast As You Can'
  },
  'The Ugly Duckling': {
    bgColor: '#0f2942',
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    goldFoil: '#38bdf8',
    spineColor: '#071728',
    imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Gentle Swan'
  },

  // Adventure & Magic
  'Jack and the Beanstalk': {
    bgColor: '#0f3829',
    textColor: '#ffffff',
    accentColor: '#6ee7b7',
    goldFoil: '#fbbf24',
    spineColor: '#072419',
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80',
    subtitle: 'To the Cloud Giant'
  },
  'Hansel and Gretel': {
    bgColor: '#3b1c11',
    textColor: '#ffffff',
    accentColor: '#fb923c',
    goldFoil: '#f59e0b',
    spineColor: '#230f07',
    imageUrl: 'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Confection Cottage'
  },
  'Puss in Boots': {
    bgColor: '#3f1f10',
    textColor: '#ffffff',
    accentColor: '#f97316',
    goldFoil: '#facc15',
    spineColor: '#241006',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Master Cat'
  },
  'The Little Mermaid': {
    bgColor: '#0b2b3d',
    textColor: '#ffffff',
    accentColor: '#22d3ee',
    goldFoil: '#38bdf8',
    spineColor: '#051824',
    imageUrl: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&auto=format&fit=crop&q=80',
    subtitle: 'Beneath Azure Waves'
  },
  'Rumpelstiltskin': {
    bgColor: '#2f1247',
    textColor: '#ffffff',
    accentColor: '#c084fc',
    goldFoil: '#fbbf24',
    spineColor: '#1b082c',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    subtitle: 'Spinning Straw into Gold'
  },

  // Fables & Legends
  'The Tortoise and the Hare (Aesop\'s Fable)': {
    bgColor: '#17361f',
    textColor: '#ffffff',
    accentColor: '#86efac',
    goldFoil: '#fbbf24',
    spineColor: '#0b2011',
    imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800&auto=format&fit=crop&q=80',
    subtitle: 'Slow and Steady Wins'
  },
  'The Three Little Pigs': {
    bgColor: '#441421',
    textColor: '#ffffff',
    accentColor: '#fb7185',
    goldFoil: '#fbbf24',
    spineColor: '#290912',
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=80',
    subtitle: 'Straw, Sticks & Brick'
  },
  'The Boy Who Cried Wolf (Aesop\'s Fable)': {
    bgColor: '#2b211a',
    textColor: '#ffffff',
    accentColor: '#fbbf24',
    goldFoil: '#f59e0b',
    spineColor: '#18120c',
    imageUrl: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&auto=format&fit=crop&q=80',
    subtitle: 'The Hills of Whispers'
  },
  'The Three Billy Goats Gruff': {
    bgColor: '#162b47',
    textColor: '#ffffff',
    accentColor: '#93c5fd',
    goldFoil: '#f59e0b',
    spineColor: '#0b1a2e',
    imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=800&auto=format&fit=crop&q=80',
    subtitle: 'Trip Trap Over the Bridge'
  }
};

export const DEFAULT_COVER: StoryCoverInfo = {
  bgColor: '#1e293b',
  textColor: '#ffffff',
  accentColor: '#38bdf8',
  goldFoil: '#fbbf24',
  spineColor: '#0f172a',
  imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  subtitle: 'Classic Bedtime Story'
};
