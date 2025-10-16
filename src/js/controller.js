import { Workout } from './models/workoutModel.js';
import { Running } from './models/runningModel.js';
import { Cycling } from './models/cyclingModel.js';
import { Map } from './models/mapModel.js';
import { renderMap } from './views/mapView.js';
import { Form } from './views/formView.js';

////////////////////////////////
// APPLICATION ARCHITECTURE

class App {
  #map;
  #mapPromise;
  #mapEvent;
  #marker;
  #zoomLevelSelected = 20;
  #form;
  #workoutCl;
  #workouts;
  #workout;
  #workoutEl;

  constructor() {
    // Initializes classes
    this.#mapPromise = new Map().mapPromise;
    this.#form = new Form();
    this.#workoutCl = new Workout();

    // When map loads,
    this._loadMap().then(res => {
      // handle click event
      this.#form.viewRenderHandler(this._showForm.bind(this), res);

      // Get data from local storage and load workouts
      this._loadWorkouts();

      // Attach event handlers
      this.#form.submitRenderHandler(this._newWorkout.bind(this));
      this.#form.inputTypeEventHandler();
      this.#form.moveViewEventHandler(this._moveToPopup.bind(this));
      this.#form.editRenderHandler(this._editForm.bind(this));
    });
  }

  // Load the map (asynchronously)
  async _loadMap() {
    try {
      this.#map = await this.#mapPromise;

      if (!this.#map)
        throw new Error('Something went wrong. Please try again later');

      // Render map on current location
      renderMap(this.#map);

      return this.#map;
    } catch (err) {
      console.error(err);
    }
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    console.log(this.#mapEvent);
    // render workout on map as marker
    const { lat, lng } = this.#mapEvent.latlng;

    this.#marker = L.marker([lat, lng]).addTo(this.#map);

    this.#form.formRemoveHiddenCl();
  }

  _loadWorkoutMarker(work) {
    if (!work) return;
    this.#marker = L.marker(work.coords).addTo(this.#map);
  }

  // This gets executed from the very beginning
  _loadWorkouts() {
    this.#workouts = this.#workoutCl.getLocalStorage();

    if (!this.#workouts) return;

    // Persist old workouts
    this.#workoutCl.workouts.push(...this.#workouts);

    this.#workouts.forEach(work => {
      this._loadWorkoutMarker(work);
      this.#form.renderPopup(work, this.#marker);
      this.#form.renderWorkout(work);
    });
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      // Will only return true if all the value is true
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = this.#form.inputType.value;
    const distance = +this.#form.inputDistance.value;
    const duration = +this.#form.inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    console.log(type, distance, duration);

    // If activity running, create running Object
    if (type === 'running') {
      const cadence = +this.#form.inputCadence.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +this.#form.inputElevation.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workoutCl.workouts.push(workout);

    // Render popup on map as marker
    this.#form.renderPopup(workout, this.#marker);

    // Render workout on list
    this.#form.renderWorkout(workout);

    // Hide form + clear input fields
    this.#form.HideForm();

    // Set local storage to all workouts
    this.#workoutCl.setLocalStorage();
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    this.#workoutEl = workoutEl;
    this.#workout = this.#workoutCl.workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(this.#workout.coords, this.#zoomLevelSelected, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click();
  }

  _rebuildWorkoutObj(workout) {
    if (workout.type === 'running') {
      workout = new Running(
        workout.coords,
        workout.distance,
        workout.duration,
        workout.cadence
      );
    }

    if (workout.type === 'cycling') {
      workout = new Cycling(
        workout.coords,
        workout.distance,
        workout.duration,
        workout.elevationGain
      );
    }

    return workout;
  }

  _editForm(e) {
    const editBtn = e.target.closest('.options__edit');

    if (!editBtn) return;

    // rebuild workout from local storage
    const workout = this._rebuildWorkoutObj(this.#workout);

    const [lat, lng] = workout.coords;
    const latlng = { lat, lng };
    this.#mapEvent = { latlng };

    // show form
    this.#form.showForm(workout);

    // find workout index and remove old workout object
    const workoutsArr = this.#workoutCl.workouts;
    const index = workoutsArr.findIndex(i => i);
    workoutsArr.splice(index, 1);

    // remove old workout
    this.#workoutEl.remove();
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
