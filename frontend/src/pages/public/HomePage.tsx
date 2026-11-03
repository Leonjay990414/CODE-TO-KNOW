import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { BrandStory } from '../../components/BrandStory';
import { LearningExperience } from '../../components/LearningExperience';
import { AIScaffoldingDemo } from '../../components/AIScaffoldingDemo';
import { StudentTeacherDual } from '../../components/StudentTeacherDual';
import { FinalCTA } from '../../components/FinalCTA';
import { Footer } from '../../components/Footer';
import { AuthModal } from '../../components/AuthModal';

export const HomePage: React.FC = () => {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login',
  });

  // IntersectionObserver for soft scroll-reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.fade-in-section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleCloseAuth = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="homepage-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenAuth={handleOpenAuth} />

      <main style={{ flex: 1 }}>
        <div className="fade-in-section is-visible">
          <Hero />
        </div>

        <div className="fade-in-section">
          <BrandStory />
        </div>

        <div className="fade-in-section">
          <LearningExperience />
        </div>

        <div className="fade-in-section">
          <AIScaffoldingDemo />
        </div>

        <div className="fade-in-section">
          <StudentTeacherDual />
        </div>

        <div className="fade-in-section">
          <FinalCTA />
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={handleCloseAuth}
      />
    </div>
  );
};
