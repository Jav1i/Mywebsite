// script.js
const toggleButton = document.querySelector('.toggle-button');
const navbarLinks = document.querySelector('.navbar-links');
const sections = document.querySelectorAll('.section');
const aboutCards = document.querySelectorAll('.about-card');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close');
const homeTitle = document.getElementById('home-title');
const valueCards = document.querySelectorAll('.value-card');

// Toggle navbar for mobile view
toggleButton.addEventListener('click', () => {
    navbarLinks.classList.toggle('active');
});
window.addEventListener('load', () => {
    document.querySelectorAll('.fade-in').forEach(element => {
        element.classList.add('show');
    });
});

// Fade-in effect when scrolling
window.addEventListener('scroll', () => {
    const triggerBottom = window.innerHeight * 0.8;

    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;

        if (sectionTop < triggerBottom) {
            section.classList.add('show');
        } else {
            section.classList.remove('show');
        }
    });

    valueCards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;

        if (cardTop < triggerBottom) {
            card.classList.add('show');
        } else {
            card.classList.remove('show');
        }
    });
});

// Open the corresponding modal when a card is clicked
aboutCards.forEach(card => {
    card.addEventListener('click', () => {
        const modalId = card.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        modal.style.display = 'flex';
    });
});

// Close modal when the close button is clicked or when clicking outside the modal content
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        button.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Typing effect for home title
const typingText = "Philip Jensen";
let typingIndex = 0;

function type() {
    if (typingIndex < typingText.length) {
        homeTitle.textContent += typingText.charAt(typingIndex);
        typingIndex++;
        setTimeout(type, 100);
    }
}

// Start typing effect when the window fully loads
window.onload = () => {
    console.log("Window loaded. Starting typing effect.");
    type();
};
document.addEventListener('DOMContentLoaded', function () {
    createExplosionParticles(50); // Adjust number for more or fewer particles
});

function createExplosionParticles(count) {
    const container = document.querySelector('.explosion-container');
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Randomly position each particle within the container
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 150; // Distance from the center (larger for a bigger explosion)
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        // Set initial transform to start at the center
        particle.style.transform = `translate(${x}px, ${y}px) scale(0.5)`;
        particle.style.animationDelay = `${Math.random()}s`;

        container.appendChild(particle);
    }
}







