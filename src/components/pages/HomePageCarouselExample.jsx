import React from 'react';
import HeroCarouselNew from '../HeroCarouselNew';

// Example of how to use the HeroCarouselNew component in your HomePage
const HomePageCarouselExample = () => {
  return (
    <div className="w-full">
      {/* Hero Section with New Carousel */}
      <section className="relative">
        <HeroCarouselNew />
      </section>
      
      {/* Other homepage content would go below */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4 text-center">Welcome to Our Website</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto text-center">
            This is an example of how to integrate the new and improved carousel component.
            Your page content would continue here.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePageCarouselExample; 