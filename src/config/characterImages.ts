// One Piece
import luffyImg from '@/assets/characters/one_piece/luffy.png';
import zoroImg from '@/assets/characters/one_piece/zoro.png';
import namiImg from '@/assets/characters/one_piece/nami.png';
import sanjiImg from '@/assets/characters/one_piece/sanji.png';

// Bleach
import ichigoImg from '@/assets/characters/bleach/ichigo.png';
import rukiaImg from '@/assets/characters/bleach/rukia.png';
import byakuyaImg from '@/assets/characters/bleach/byakuya.png';
import toshiroImg from '@/assets/characters/bleach/toshiro.png';

// Naruto
import narutoImg from '@/assets/characters/naruto/naruto.png';
import sasukeImg from '@/assets/characters/naruto/sasuke.png';
import kakashiImg from '@/assets/characters/naruto/kakashi.png';
import sakuraImg from '@/assets/characters/naruto/sakura.png';

// Dandadan
import momoImg from '@/assets/characters/dandadan/momo.png';
import okarunImg from '@/assets/characters/dandadan/okarun.png';
import turboGrannyImg from '@/assets/characters/dandadan/turbo_granny.png';
import airaImg from '@/assets/characters/dandadan/aira.png';

export const characterImages: Record<string, string> = {
  // One Piece
  'Luffy': luffyImg,
  'Zoro': zoroImg,
  'Nami': namiImg,
  'Sanji': sanjiImg,
  
  // Bleach
  'Ichigo': ichigoImg,
  'Rukia': rukiaImg,
  'Byakuya': byakuyaImg,
  'Toshiro': toshiroImg,
  
  // Naruto
  'Naruto': narutoImg,
  'Sasuke': sasukeImg,
  'Kakashi': kakashiImg,
  'Sakura': sakuraImg,
  
  // Dandadan
  'Momo': momoImg,
  'Okarun': okarunImg,
  'Turbo Granny': turboGrannyImg,
  'Aira': airaImg,
};

export const getCharacterImage = (characterName: string): string | null => {
  return characterImages[characterName] || null;
};
