import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const targets = 'main section :is(article, .bg-card, img, h2, h3, p)';

export default function ScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.getElementById('main-content');
    if (!root || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('agency-revealed');
        observer.unobserve(target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    const register = (node) => {
      if (!(node instanceof Element)) return;
      const candidates = [node, ...node.querySelectorAll(targets)];
      candidates.forEach((element) => {
        if (!element.matches(targets) || element.classList.contains('agency-scroll-reveal') || element.closest('.site-hero, form, nav')) return;
        if (element.closest('article') && element.tagName !== 'ARTICLE') return;
        if (element.closest('.bg-card') && !element.classList.contains('bg-card')) return;
        if (element.tagName === 'IMG' && element.closest('[aria-hidden="true"]')) return;
        element.classList.add('agency-scroll-reveal');
        if (element.tagName === 'IMG') element.classList.add('agency-scroll-image');
        observer.observe(element);
      });
    };

    register(root);
    const mutations = new MutationObserver((records) => records.forEach(({ addedNodes }) => addedNodes.forEach(register)));
    mutations.observe(root, { childList: true, subtree: true });
    return () => { mutations.disconnect(); observer.disconnect(); };
  }, [pathname]);

  return null;
}