
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Logo() {
  const logo = PlaceHolderImages.find(img => img.id === 'gwd-logo');
  
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-white flex items-center justify-center border-2 border-blue-100 shadow-sm">
      <Image 
        src={logo?.imageUrl || "https://picsum.photos/seed/gwd-kerala-logo/200/200"}
        alt="Ground Water Department Logo"
        width={48}
        height={48}
        className="object-contain p-1"
        data-ai-hint={logo?.imageHint || "water logo"}
      />
    </div>
  );
}
