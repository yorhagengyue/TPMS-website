import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FiCalendar, FiMapPin, FiInfo, FiFilter } from 'react-icons/fi';

// Event data with text-based icons instead of emojis
const events = [
  {
    id: 1,
    title: "Weekly Chess Tournament",
    date: "Every Friday, 3-6pm",
    location: "Block 3 Level 2",
    description: "Join our weekly chess tournament and improve your skills! Open to players of all skill levels with prizes for winners.",
    type: "Regular",
    iconText: "C",
    iconBg: "bg-blue-100 text-blue-800"
  },
  {
    id: 2,
    title: "Inter-Polytechnic Championship",
    date: "March 15, 2024",
    location: "TP Auditorium",
    description: "Annual championship between all polytechnics in Singapore. Register by March 10 to represent TP in this prestigious event.",
    type: "Special",
    iconText: "T",
    iconBg: "bg-amber-100 text-amber-800"
  },
  {
    id: 3,
    title: "Strategy Games Workshop",
    date: "February 20, 2024",
    location: "TP Hub, Level 2",
    description: "Learn the basics of strategic board games with our experienced instructors. Perfect for beginners!",
    type: "Workshop",
    iconText: "W",
    iconBg: "bg-emerald-100 text-emerald-800"
  },
  {
    id: 4,
    title: "Go Tournament",
    date: "Every Monday, 4-7pm",
    location: "Block 5 Level 3",
    description: "Weekly Go tournament for enthusiasts. Come practice this ancient strategic board game in a friendly environment.",
    type: "Regular",
    iconText: "G",
    iconBg: "bg-gray-100 text-gray-800"
  },
  {
    id: 5,
    title: "Digital Strategy Gaming Night",
    date: "February 25, 2024",
    location: "Online Event",
    description: "Join us for a night of digital strategy games. We'll be playing various popular titles and competing in friendly matches.",
    type: "Special",
    iconText: "D",
    iconBg: "bg-purple-100 text-purple-800"
  }
];

export const EventsPage = () => {
  const [filter, setFilter] = useState('All');
  const eventTypes = ['All', 'Regular', 'Special', 'Workshop'];
  
  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(event => event.type === filter);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Page Introduction */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Upcoming Events</h2>
        <p className="text-gray-600 max-w-3xl">
          Discover and join our upcoming events and activities. From regular weekly sessions to special tournaments, 
          there's something for everyone interested in strategic gaming.
        </p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <FiFilter className="text-primary-600 w-5 h-5" />
        <span className="text-gray-700 font-medium mr-2">Filter by:</span>
        
        {eventTypes.map(type => (
          <Button 
            key={type}
            variant={filter === type ? "default" : "outline"}
            className={`rounded-full px-4 py-1 text-sm ${
              filter === type ? "bg-primary-600" : "hover:bg-primary-50"
            }`}
            onClick={() => setFilter(type)}
          >
            {type}
          </Button>
        ))}
      </div>
      
      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-t-4 border-t-primary-500 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${event.iconBg}`}>
                      {event.iconText}
                    </div>
                    <CardTitle className="text-xl font-semibold">{event.title}</CardTitle>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.type === 'Special' 
                      ? 'bg-amber-100 text-amber-800' 
                      : event.type === 'Workshop'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {event.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-gray-700 flex items-center gap-2">
                      <FiCalendar className="text-primary-600 w-4 h-4 flex-shrink-0" />
                      <span>{event.date}</span>
                    </p>
                    <p className="text-gray-700 flex items-center gap-2">
                      <FiMapPin className="text-primary-600 w-4 h-4 flex-shrink-0" />
                      <span>{event.location}</span>
                    </p>
                  </div>
                  
                  <p className="text-gray-600 text-sm border-t border-gray-100 pt-4">
                    {event.description}
                  </p>
                  
                  <Button variant="link" className="p-0 h-auto text-primary-600 hover:text-primary-800">
                    Learn more →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <FiInfo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No events found</h3>
          <p className="text-gray-500">There are no {filter.toLowerCase()} events currently scheduled.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setFilter('All')}
          >
            Show all events
          </Button>
        </div>
      )}
    </div>
  );
}; 