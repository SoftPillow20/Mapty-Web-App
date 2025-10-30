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
  #mapObj;
  #mapPromise;
  #mapEvent;
  #marker;
  #zoomLevelSelected = 13;
  #formCl;
  #workoutCl;
  #workouts;
  #workout;
  #workoutEl;
  #editMode = false;

  constructor() {
    // Initializes classes
    this.#mapPromise = new Map().mapPromise;
    this.#formCl = new Form();
    this.#workoutCl = new Workout();

    // When map loads,
    this._loadMap().then(mapObj => {
      // handle click event
      this.#formCl.viewRenderHandler(this._showForm.bind(this), mapObj);

      this.#formCl.viewRenderHandler(this._cancelEdit.bind(this), mapObj);

      // Get data from local storage and load workouts
      this._loadWorkouts();

      // Attach event handlers
      this.#formCl.submitRenderHandler(this._newWorkout.bind(this));
      this.#formCl.inputTypeEventHandler();
      this.#formCl.moveViewEventHandler(this._moveToPopup.bind(this));
      this.#formCl.optionsRenderHandler(this._editForm.bind(this));
      this.#formCl.optionsRenderHandler(this._deleteWorkout.bind(this));
      this.#formCl.optionsRenderHandler(this._cancelFunc.bind(this));
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

    console.log(this.#mapEvent.latlng);

    // render workout on map as marker
    const { lat, lng } = this.#mapEvent.latlng;

    this.#marker = L.marker([lat, lng]).addTo(this.#map);

    this.#formCl.formRemoveHiddenCl();

    this.#formCl.renderCancelBtn();
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
      this.#formCl.renderPopup(work, this.#marker);
      const workoutHtml = this.#formCl.setRenderWorkout(work);

      this.#formCl.renderWorkoutOnForm(workoutHtml);
    });
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      // Will only return true if all the value is true
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = this.#formCl.inputType.value;
    const distance = +this.#formCl.inputDistance.value;
    const duration = +this.#formCl.inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If activity running, create running Object
    if (type === 'running') {
      const cadence = +this.#formCl.inputCadence.value;

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
      const elevation = +this.#formCl.inputElevation.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    console.log(this.#workout, this.#workoutEl);

    // Render popup on map as marker
    if (!this.#workout && !this.#workoutEl) {
      this.#workoutCl.workouts.push(workout);
      this.#formCl.renderPopup(workout, this.#marker);
    }

    console.log(this.#marker.getPopup());

    // Render workout on list
    const workoutHtml = this.#formCl.setRenderWorkout(workout);

    this.#formCl.renderWorkoutOnForm(workoutHtml);

    // Hide form + clear input fields
    this.#formCl.HideForm();

    // if in edit mode
    // remove old workout
    if (this.#workout && this.#workoutEl) {
      // close previous popup

      this._replaceOldWorkout(workout);

      window.location.reload();
    } else {
      this.#formCl.removeCancelBtn();
    }

    console.log(this.#workoutCl.workouts);

    // Set local storage to all workouts
    this.#workoutCl.setLocalStorage();
  }

  _replaceOldWorkout(workout) {
    console.log(this.#workout, workout);

    // remove previous workout
    this._removeOldWorkout();

    // add new workout
    this.#workoutCl.workouts.push(workout);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    // if user is on edit mode
    // and clicks on another workout
    // auto hide form and show hidden workout element
    if (this.#editMode) {
      this.#formCl.showCurrentWorkout(this.#workoutEl);
      this.#formCl.HideForm();
    }

    // if user is on create mode but clicks on workout
    // auto cancel create mode
    if (!this.#editMode && !this.#formCl.form.classList.contains('hidden')) {
      this.#formCl.cancelCreateMode(this.#map, this.#marker);
    }

    // save selected workout element
    this.#workoutEl = workoutEl;

    // save selected workout object
    this.#workout = this.#workoutCl.workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    console.log(this.#workout);
    console.log(this.#marker.getPopup());
    console.log(this.#workoutCl.workouts);

    // set the map according to the selected workout object
    this.#map.setView(this.#workout.coords, this.#zoomLevelSelected, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    this.#formCl.workoutSelected(this.#workoutEl);

    this.#formCl.renderOptions();

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

    // if edit button was not clicked
    // or if there's a form already existed
    // return early
    if (!editBtn || !this.#formCl.form.classList.contains('hidden')) return;

    const [lat, lng] = this.#workout.coords;
    const latlng = { lat, lng };
    this.#mapEvent = { latlng };

    console.log(this.#workout.type);

    // show form
    this.#formCl.showForm(this.#workout);

    // console.log(this.#marker.getPopup());

    // console.log(this.#marker.getLatLng());

    // render correct input field
    this.#formCl.renderInputField(this.#workout);

    // hide old workout
    this.#formCl.hideCurrentWorkout(this.#workoutEl);

    // set modal to active
    this.#editMode = true;
    this.#formCl.setModalActive(
      this.#editMode,
      this.#map,
      this._showForm.bind(this)
    );
  }

  _deleteWorkout(e) {
    const deleteBtn = e.target.closest('.options__delete');

    console.log(this.#workout);

    if (!deleteBtn && !this.#workout) return;
    console.log(this.#workout);

    this.#formCl.activeSidebarModal(this.#workout);
  }

  _cancelFunc(e) {
    const cancelBtn = e.target.closest('.options__cancel');

    if (!cancelBtn) return;

    if (!this.#workout && !this.#workoutEl) {
      this.#formCl.cancelCreateMode(this.#map, this.#marker);
    } else {
      this._cancelEdit(false);

      if (this.#editMode === true) {
        // set edit mode to false
        this.#editMode = false;
        this.#formCl.setModalActive(
          this.#editMode,
          this.#map,
          this._showForm.bind(this)
        );
      }
    }
  }

  _cancelEdit(editMode = true) {
    // console.log(this.#workout, this.#workoutEl);

    if (!this.#workout && !this.#workoutEl) return;

    this.#formCl.optionsDefault(this.#workoutEl, editMode);

    // resets workout selection
    this._deselectWorkout();

    // resets the form
    this.#formCl.resetForm();
  }

  _deselectWorkout() {
    this.#workout = null;
    this.#workoutEl = null;
  }

  _removeOldWorkout() {
    // find workout index and remove old workout object
    const workoutsArr = this.#workoutCl.workouts;
    const index = workoutsArr.findIndex(work => work.id === this.#workout.id);

    if (this.#workoutEl.getAttribute('aria-selected') !== 'true') return;

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
