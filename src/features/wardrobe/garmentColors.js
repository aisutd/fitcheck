const COLORS = {
 black: '#242424', white: '#F5F4EF', ivory: '#EEE8DA', cream: '#EEE4D1', beige: '#CABCA4', stone: '#AAA79D',
 red: '#B7383E', burgundy: '#713648', oxblood: '#783D49', pink: '#D998AA', coral: '#D8755D', orange: '#C87942',
 yellow: '#D7BC53', mustard: '#B99739', green: '#53775D', forest: '#40594A', olive: '#777C50', sage: '#A8B7A2',
 blue: '#497AB0', navy: '#283950', indigo: '#34475D', cobalt: '#426FC4', 'sky blue': '#91B6CC',
 purple: '#79568E', plum: '#674B6F', lavender: '#B9A8CE', brown: '#705345', 'dark brown': '#493831',
 espresso: '#624333', tan: '#B8946F', gray: '#92938E', grey: '#92938E', charcoal: '#454A47', silver: '#B8B9B6', gold: '#C4A25B',
};
function garmentColor(name, fallback = '') {
 const normalized = typeof name === 'string' ? name.trim().toLowerCase() : '';
 if (/^#[\da-f]{6}$/i.test(normalized)) return normalized;
 const exact = COLORS[normalized];
 if (exact) return exact;
 const match = Object.keys(COLORS).sort((a,b) => b.length-a.length).find((color) => new RegExp(`\\b${color}\\b`).test(normalized));
 return match ? COLORS[match] : /^#[\da-f]{6}$/i.test(fallback) ? fallback : '';
}
module.exports = { garmentColor };
