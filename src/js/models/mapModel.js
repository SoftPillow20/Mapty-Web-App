export class MapModel {
  mapPromise;
  mapZoomLevel = 13;

  // use geolocation to get user's current position (asynchronously)
  _getGeoLocation() {
    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  // Get user's position (asynchronously)
  async getPosition(permission) {
    try {
      // get Geolocation
      if (permission) {
        const pos = await this._getGeoLocation();
        const { latitude: lat, longitude: lng } = pos.coords;

        return this._getCoordinates([lat, lng]);
      }
    } catch (err) {
      throw err;
    }
  }

  // returns map object
  _getCoordinates(coordinates) {
    // Set coordinates on the map
    const map = L.map('map').setView(coordinates, this.mapZoomLevel);
    return map;
  }
}
