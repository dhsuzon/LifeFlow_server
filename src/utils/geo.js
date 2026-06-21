const { districts, upazilas } = require("../data/bdgeoData");

function isValidLocation(districtName, upazilaName) {
  const district = districts.find((item) => item.name === districtName);
  const validUpazila =
    district &&
    upazilas.some(
      (item) =>
        item.name === upazilaName &&
        String(item.district_id) === String(district.id),
    );
  return Boolean(district && validUpazila);
}

module.exports = { isValidLocation };
