export interface User {
    id: string;
    username: string;
    avatar: string;
}

export interface Category {
    id: string;
    title: string;
    description: string;
    topicCount: number;
    postCount: number;
    icon: string; // Emoji character for now
    color: string;
}

export interface Thread {
    id: string;
    title: string;
    author: User;
    categoryId: string;
    categoryName: string;
    tags: string[];
    viewCount: number;
    replyCount: number;
    createdAt: string;
    isPinned?: boolean;
}

export const mockCategories: Category[] = [
    {
        id: '1',
        title: 'Genel Sohbet',
        description: 'Her şey hakkında konuşabileceğiniz genel alan.',
        topicCount: 1205,
        postCount: 5403,
        icon: '💬',
        color: 'from-blue-500 to-cyan-400'
    },
    {
        id: '2',
        title: 'Yazılım & Teknoloji',
        description: 'Kodlama, donanım ve teknoloji dünyası.',
        topicCount: 850,
        postCount: 3200,
        icon: '💻',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: '3',
        title: 'Tasarım & Sanat',
        description: 'UI/UX, grafik tasarım ve dijital sanatlar.',
        topicCount: 430,
        postCount: 1500,
        icon: '🎨',
        color: 'from-orange-400 to-red-400'
    },
    {
        id: '4',
        title: 'Oyun Dünyası',
        description: 'Oyun incelemeleri, haberler ve tartışmalar.',
        topicCount: 620,
        postCount: 2800,
        icon: '🎮',
        color: 'from-green-400 to-emerald-500'
    },
    {
        id: '5',
        title: 'Bilim & Eğitim',
        description: 'Akademik tartışmalar, bilimsel gelişmeler.',
        topicCount: 210,
        postCount: 890,
        icon: '🧬',
        color: 'from-indigo-500 to-violet-500'
    }
];

export const mockThreads: Thread[] = [
    {
        id: '1',
        title: 'React 19 ile gelen yenilikler neler?',
        author: { id: 'u1', username: 'frontend_master', avatar: 'https://ui-avatars.com/api/?name=F+M&background=0D8ABC&color=fff' },
        categoryId: '2',
        categoryName: 'Yazılım & Teknoloji',
        tags: ['react', 'javascript', 'web'],
        viewCount: 1205,
        replyCount: 45,
        createdAt: '2 saat önce',
        isPinned: true
    },
    {
        id: '2',
        title: 'En iyi UI tasarım trendleri 2024',
        author: { id: 'u2', username: 'design_guru', avatar: 'https://ui-avatars.com/api/?name=D+G&background=random' },
        categoryId: '3',
        categoryName: 'Tasarım & Sanat',
        tags: ['ui', 'ux', 'trends'],
        viewCount: 890,
        replyCount: 32,
        createdAt: '5 saat önce',
        isPinned: true
    },
    {
        id: '3',
        title: 'Hangi mekanik klavyeyi almalıyım?',
        author: { id: 'u3', username: 'gamer_tr', avatar: 'https://ui-avatars.com/api/?name=G+T&background=random' },
        categoryId: '2',
        categoryName: 'Yazılım & Teknoloji',
        tags: ['hardware', 'peripherals'],
        viewCount: 340,
        replyCount: 56,
        createdAt: '1 gün önce'
    },
    {
        id: '4',
        title: 'Cyberpunk 2077 son güncelleme yorumları',
        author: { id: 'u4', username: 'night_city', avatar: 'https://ui-avatars.com/api/?name=N+C&background=random' },
        categoryId: '4',
        categoryName: 'Oyun Dünyası',
        tags: ['cyberpunk', 'rpg', 'gaming'],
        viewCount: 5600,
        replyCount: 230,
        createdAt: '2 gün önce'
    },
    {
        id: '5',
        title: 'Yapay zeka işimizi elimizden alacak mı?',
        author: { id: 'u5', username: 'ai_watcher', avatar: 'https://ui-avatars.com/api/?name=A+W&background=random' },
        categoryId: '2',
        categoryName: 'Yazılım & Teknoloji',
        tags: ['ai', 'future', 'jobs'],
        viewCount: 3400,
        replyCount: 890,
        createdAt: '3 gün önce'
    }
];
