import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "../ui/button";
import { Carousel } from "../ui/carousel";

export const HomePage = () => {
  const activities = [
    {
      title: "Chess",
      image: "/images/chess.jpg",
      description: "Weekly tournaments and training sessions",
      details: "Chess is an intellectual sport that tests strategic thinking. We organize weekly training sessions and tournaments."
    },
    {
      title: "Go",
      image: "/images/go.jpg",
      description: "Traditional strategy board game",
      details: "Go is an ancient strategic board game that cultivates patience and holistic thinking abilities."
    },
    {
      title: "Strategy Games",
      image: "/images/strategy.jpg",
      description: "Modern digital strategy games",
      details: "E-sports and digital strategy games that enhance decision-making and team collaboration skills."
    },
    {
      title: "Board Games",
      image: "/images/board.jpg",
      description: "Various strategic board games",
      details: "Various board games that promote social interaction and strategic thinking."
    }
  ];

  const stats = [
    { number: "500+", text: "Active Members", description: "Enthusiastic members from different faculties" },
    { number: "50+", text: "Annual Events", description: "Diverse competitions and activities" },
    { number: "20+", text: "Professional Coaches", description: "Experienced instructors and mentors" },
    { number: "10+", text: "Partners", description: "Collaborations with multiple institutions" }
  ];

  const achievements = [
    {
      year: "2023",
      title: "National Chess Championship",
      description: "Our team won the team championship in the National University Chess Tournament."
    },
    {
      year: "2023",
      title: "Singapore Go Open",
      description: "Secured second place in the Singapore Go Open, demonstrating our strength."
    },
    {
      year: "2022",
      title: "E-Sports League",
      description: "Won third place in the National University E-Sports League."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Carousel */}
      <div className="relative">
        <Carousel />
      </div>

      {/* Activities Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-2xl font-normal text-gray-800 mb-2">OUR ACTIVITIES</h2>
            <div className="w-20 h-0.5 bg-blue-600"></div>
            <p className="mt-4 text-gray-600 max-w-2xl">
              We offer diverse mind sports programs aimed at developing students' strategic thinking and team collaboration skills.
              Each program is guided by experienced coaches, ensuring professional training for all participants.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={activity.image} 
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl text-gray-800 font-semibold mb-2">{activity.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{activity.details}</p>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-8"
              >
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-xl mb-2">{stat.text}</div>
                <div className="text-blue-200 text-sm">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-2xl font-normal text-gray-800 mb-2">OUR ACHIEVEMENTS</h2>
            <div className="w-20 h-0.5 bg-blue-600"></div>
            <p className="mt-4 text-gray-600 max-w-2xl">
              Over the years, we have achieved excellent results in various competitions, 
              witnessing the growth and progress of our team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 shadow-lg rounded-lg"
              >
                <div className="text-blue-600 font-bold mb-2">{achievement.year}</div>
                <h3 className="text-xl font-semibold mb-4">{achievement.title}</h3>
                <p className="text-gray-600">{achievement.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-2xl font-normal text-gray-800 mb-2">LATEST NEWS</h2>
            <div className="w-20 h-0.5 bg-blue-600"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                date: "2024-01-05",
                title: "New Semester Recruitment",
                content: "Join our community! We welcome all students interested in mind sports to become part of our family."
              },
              {
                date: "2024-01-03",
                title: "Annual Review Meeting",
                content: "Reflecting on the past year's highlights and planning for future developments."
              },
              {
                date: "2024-01-01",
                title: "New Year Greetings",
                content: "Happy New Year to all members! Let's continue to progress and achieve great results in the new year."
              }
            ].map((news, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <div className="text-gray-500 text-sm mb-2">{news.date}</div>
                <h3 className="text-xl font-semibold mb-4">{news.title}</h3>
                <p className="text-gray-600">{news.content}</p>
                <Button variant="link" className="mt-4 text-blue-600">
                  Read More →
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}; 