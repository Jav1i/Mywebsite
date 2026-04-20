// Mobile Navbar Toggle
const toggleButton = document.querySelector('.toggle-button');
const navbarLinks = document.querySelector('.navbar-links');
toggleButton.addEventListener('click', (e) => {
  e.preventDefault();
  navbarLinks.classList.toggle('active');
});

// Close mobile menu after clicking a link
document.querySelectorAll('.navbar-links a').forEach(link => {
  link.addEventListener('click', () => {
    navbarLinks.classList.remove('active');
  });
});

// Light/Dark Mode Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
});

// Fade-in on Scroll for Sections, Value Cards, and Timeline Events
const sections = document.querySelectorAll('.section');
const valueCards = document.querySelectorAll('.value-card');
const timelineEvents = document.querySelectorAll('.timeline-event');

function revealOnScroll() {
  const triggerBottom = window.innerHeight * 0.85;
  sections.forEach(section => {
    if (section.getBoundingClientRect().top < triggerBottom) {
      section.classList.add('show');
    }
  });
  valueCards.forEach(card => {
    if (card.getBoundingClientRect().top < triggerBottom) {
      card.classList.add('show');
    }
  });
  timelineEvents.forEach(event => {
    if (event.getBoundingClientRect().top < triggerBottom) {
      event.classList.add('show');
    }
  });
}

document.addEventListener('DOMContentLoaded', revealOnScroll);
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('resize', revealOnScroll);

// About Card Modals
const aboutCards = document.querySelectorAll('.about-card');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close');

aboutCards.forEach(card => {
  card.addEventListener('click', () => {
    const modalId = card.getAttribute('data-modal');
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  });
});
closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    button.closest('.modal').style.display = 'none';
  });
});
window.addEventListener('click', (event) => {
  modals.forEach(modal => {
    if (event.target === modal) modal.style.display = 'none';
  });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    modals.forEach(modal => (modal.style.display = 'none'));
  }
});

// Typing Effect for Home Title
const homeTitle = document.getElementById('home-title');
const typingText = 'Philip Jensen';
let typingIndex = 0;
function type() {
  if (typingIndex < typingText.length) {
    homeTitle.textContent += typingText.charAt(typingIndex);
    typingIndex++;
    setTimeout(type, 120);
  }
}
document.addEventListener('DOMContentLoaded', type);

// Subtle Background Zoom on Scroll (applied to hero ::before via CSS variable)
const homeSection = document.getElementById('home');
window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY;
  const scale = 1 + Math.min(scrollPos / 2000, 0.15);
  homeSection.style.setProperty('--hero-scale', scale);
});
