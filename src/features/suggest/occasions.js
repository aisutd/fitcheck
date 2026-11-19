const OCCASIONS = ['Work', 'Date Night', 'Casual', 'Formal', 'Gym', 'Concert', 'Travel', 'Sleepwear'];
function requiredCategories(occasion) {
  return occasion === 'Sleepwear' ? ['top', 'bottom'] : ['top', 'bottom', 'shoes'];
}
module.exports = { OCCASIONS, requiredCategories };
