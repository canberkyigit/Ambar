import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SocialPost } from '../types/cocktail';

const USERNAMES = [
  'cocktail_lover', 'mixmaster_jane', 'shaker_pro', 'bar_tender_life',
  'drink_explorer', 'citrus_queen', 'bourbon_boy', 'mojito_maria',
  'tiki_tom', 'martini_master', 'negroni_nina', 'daiquiri_dave',
  'spirits_sarah', 'ice_cold_ian', 'aperol_anna',
];

const AVATAR_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

const CAPTIONS = [
  'Perfect evening drink', 'Finally nailed this recipe!',
  'Date night vibes', 'Summer in a glass',
  'My new favorite', 'Cheers to the weekend!',
  'Home bar experiment', 'Classic never gets old',
  'Trying something new tonight', 'This one hits different',
  'Bartender mode: ON', 'Sunset sips',
  'Happy hour at home', 'Friday feeling',
  'Mixing up something special', 'Thirsty Thursday',
  'Craft cocktail goals', 'Shake shake shake',
  'On the rocks tonight', 'Tropical paradise in a cup',
];

const MOCK_COCKTAILS = [
  { id: '11007', name: 'Margarita', img: 'https://www.thecocktaildb.com/images/media/drink/wpxpvu1439905379.jpg' },
  { id: '11001', name: 'Old Fashioned', img: 'https://www.thecocktaildb.com/images/media/drink/vrwquq1478252802.jpg' },
  { id: '11000', name: 'Mojito', img: 'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg' },
  { id: '17222', name: 'A1', img: 'https://www.thecocktaildb.com/images/media/drink/2x8thr1504816928.jpg' },
  { id: '11003', name: 'Negroni', img: 'https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg' },
  { id: '11002', name: 'Whiskey Sour', img: 'https://www.thecocktaildb.com/images/media/drink/hbkfsh1589574990.jpg' },
  { id: '11004', name: 'Cosmopolitan', img: 'https://www.thecocktaildb.com/images/media/drink/kpsajh1504368362.jpg' },
  { id: '11005', name: 'Daiquiri', img: 'https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg' },
  { id: '11006', name: 'Manhattan', img: 'https://www.thecocktaildb.com/images/media/drink/yk70e31606771240.jpg' },
  { id: '11008', name: 'Pina Colada', img: 'https://www.thecocktaildb.com/images/media/drink/cpf4j51504371346.jpg' },
  { id: '11009', name: 'Moscow Mule', img: 'https://www.thecocktaildb.com/images/media/drink/3pylqc1504370988.jpg' },
  { id: '11010', name: 'Espresso Martini', img: 'https://www.thecocktaildb.com/images/media/drink/n0og681504820092.jpg' },
  { id: '11011', name: 'Mai Tai', img: 'https://www.thecocktaildb.com/images/media/drink/twyrrp1439907470.jpg' },
  { id: '17196', name: 'Cuba Libre', img: 'https://www.thecocktaildb.com/images/media/drink/uuxsrr1473206647.jpg' },
  { id: '11012', name: 'Aperol Spritz', img: 'https://www.thecocktaildb.com/images/media/drink/iloasq1587661955.jpg' },
  { id: '11013', name: 'Caipirinha', img: 'https://www.thecocktaildb.com/images/media/drink/jgvn7p1582484435.jpg' },
  { id: '11014', name: 'Tom Collins', img: 'https://www.thecocktaildb.com/images/media/drink/qysvud1441553807.jpg' },
  { id: '11015', name: 'Gin & Tonic', img: 'https://www.thecocktaildb.com/images/media/drink/z0omyp1582480573.jpg' },
  { id: '11016', name: 'Bloody Mary', img: 'https://www.thecocktaildb.com/images/media/drink/t6caa21582485702.jpg' },
  { id: '11017', name: 'Long Island', img: 'https://www.thecocktaildb.com/images/media/drink/nkwr4c1606770558.jpg' },
];

function generateMockPosts(): SocialPost[] {
  const now = Date.now();
  return MOCK_COCKTAILS.map((c, i) => ({
    id: `post_${i}`,
    username: USERNAMES[i % USERNAMES.length],
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    cocktailName: c.name,
    cocktailId: c.id,
    imageUrl: c.img,
    caption: CAPTIONS[i % CAPTIONS.length],
    likeCount: Math.floor(Math.random() * 200) + 10,
    comments: i % 3 === 0 ? [
      { id: `c_${i}_1`, username: USERNAMES[(i + 3) % USERNAMES.length], text: 'Looks amazing! 🔥', timestamp: now - 3600000 },
      { id: `c_${i}_2`, username: USERNAMES[(i + 5) % USERNAMES.length], text: 'Recipe please!', timestamp: now - 1800000 },
    ] : i % 3 === 1 ? [
      { id: `c_${i}_1`, username: USERNAMES[(i + 2) % USERNAMES.length], text: 'Need to try this!', timestamp: now - 7200000 },
    ] : [],
    timestamp: now - i * 3600000 * Math.random() * 5,
  }));
}

interface SocialState {
  posts: SocialPost[];
  likedPosts: string[];
  savedPosts: string[];
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  addPost: (post: Omit<SocialPost, 'id' | 'timestamp' | 'likeCount' | 'comments'>) => void;
  deletePost: (postId: string) => void;
  isLiked: (postId: string) => boolean;
  isSaved: (postId: string) => boolean;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      posts: generateMockPosts(),
      likedPosts: [],
      savedPosts: [],
      toggleLike: (postId) =>
        set((state) => {
          const liked = state.likedPosts.includes(postId);
          return {
            likedPosts: liked
              ? state.likedPosts.filter((id) => id !== postId)
              : [...state.likedPosts, postId],
            posts: state.posts.map((p) =>
              p.id === postId
                ? { ...p, likeCount: p.likeCount + (liked ? -1 : 1) }
                : p,
            ),
          };
        }),
      addComment: (postId, text) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    { id: `c_${Date.now()}`, username: 'you', text, timestamp: Date.now() },
                  ],
                }
              : p,
          ),
        })),
      addPost: (post) =>
        set((state) => ({
          posts: [
            {
              ...post,
              id: `post_${Date.now()}`,
              timestamp: Date.now(),
              likeCount: 0,
              comments: [],
            },
            ...state.posts,
          ],
        })),
      deletePost: (postId) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
          likedPosts: state.likedPosts.filter((id) => id !== postId),
          savedPosts: state.savedPosts.filter((id) => id !== postId),
        })),
      toggleSave: (postId) =>
        set((state) => ({
          savedPosts: state.savedPosts.includes(postId)
            ? state.savedPosts.filter((id) => id !== postId)
            : [...state.savedPosts, postId],
        })),
      isLiked: (postId) => get().likedPosts.includes(postId),
      isSaved: (postId) => get().savedPosts.includes(postId),
    }),
    {
      name: 'social-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
