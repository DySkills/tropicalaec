// Tropical AEC Specification Database
const articles = [];

const categories = [
  { id: 'envelope', name: 'Building Envelope & Insulation', icon: 'shield-check', count: 0 },
  { id: 'structural', name: 'Structural & Framing Systems', icon: 'cube', count: 0 },
  { id: 'moisture', name: 'Moisture, Vapor & Waterproofing', icon: 'water', count: 0 },
  { id: 'mechanical', name: 'Mechanical, HVAC & Decarbonization', icon: 'sun', count: 0 },
  { id: 'materials', name: 'Material Science & Testing', icon: 'beaker', count: 0 }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { articles, categories };
}
