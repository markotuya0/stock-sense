import { HeroSection } from '../features/landing/HeroSection';
import { SocialProofTicker } from '../features/landing/SocialProofTicker';

export const LandingPage: React.FC = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <SocialProofTicker />
      
      {/* Additional sections would go here */}
      <section className="py-20 container mx-auto px-6 text-center">
         <h2 className="text-3xl font-bold mb-10">Trusted by modern investors.</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale">
            {/* Logos placeholder */}
            <div className="flex items-center justify-center font-bold text-xl tracking-widest uppercase">Linear</div>
            <div className="flex items-center justify-center font-bold text-xl tracking-widest uppercase">Stripe</div>
            <div className="flex items-center justify-center font-bold text-xl tracking-widest uppercase">Vercel</div>
            <div className="flex items-center justify-center font-bold text-xl tracking-widest uppercase">Supabase</div>
         </div>
      </section>
    </main>
  );
};
