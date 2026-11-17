import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { BrandStory } from '../../components/BrandStory';
import { LearningExperience } from '../../components/LearningExperience';
import { AIScaffoldingDemo } from '../../components/AIScaffoldingDemo';
import { StudentTeacherDual } from '../../components/StudentTeacherDual';
import { MembershipComparison } from '../../components/MembershipComparison';
import { FinalCTA } from '../../components/FinalCTA';
import { Footer } from '../../components/Footer';
import { AuthModal } from '../../components/AuthModal';
import { TeacherApplyModal } from '../../components/TeacherApplyModal';
import { useAuth } from '../../context/AuthContext';

interface HomePageProps {
  onOpenTeacherApply?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenTeacherApply }) => {
  const { authModalOpen, authModalMode, openAuth, closeAuth } = useAuth();
  const [localTeacherModalOpen, setLocalTeacherModalOpen] = useState(false);

  const handleTeacherApplyClick = () => {
    if (onOpenTeacherApply) {
      onOpenTeacherApply();
    } else {
      setLocalTeacherModalOpen(true);
    }
  };

  // IntersectionObserver for soft scroll-reveal animations with reduced-motion support
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.fade-in-section, .reveal-scroll-up').forEach((el) => {
        el.classList.add('is-visible', 'is-revealed');
      });
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.fade-in-section, .reveal-scroll-up').forEach((el) => {
        el.classList.add('is-visible', 'is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible', 'is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    const sections = document.querySelectorAll('.fade-in-section, .reveal-scroll-up');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenAuth={openAuth}
        onOpenTeacherApply={handleTeacherApplyClick}
      />

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
          <StudentTeacherDual
            onOpenTeacherApply={handleTeacherApplyClick}
          />
        </div>

        <div className="fade-in-section">
          <MembershipComparison onOpenAuth={openAuth} />
        </div>

        <div className="fade-in-section">
          <FinalCTA />
        </div>
      </main>

      <Footer />

      {/* Standalone fallback if rendered without App root modals */}
      {!onOpenTeacherApply && (
        <>
          <AuthModal
            isOpen={authModalOpen}
            mode={authModalMode}
            onClose={closeAuth}
          />
          <TeacherApplyModal
            isOpen={localTeacherModalOpen}
            onClose={() => setLocalTeacherModalOpen(false)}
            onOpenAuth={openAuth}
          />
        </>
      )}
    </div>
  );
};
