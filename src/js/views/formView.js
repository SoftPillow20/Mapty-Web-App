export class Form {
  constructor() {
    this.form = document.querySelector('.form');
    this.modal = document.querySelector('.modal');
    this.containerWorkouts = document.querySelector('.workouts');
    this.containerOptions = document.querySelector('.options');
    this.inputType = document.querySelector('.form__input--type');
    this.inputDistance = document.querySelector('.form__input--distance');
    this.inputDuration = document.querySelector('.form__input--duration');
    this.inputCadence = document.querySelector('.form__input--cadence');
    this.inputElevation = document.querySelector('.form__input--elevation');
  }

  viewRenderHandler(handler, mapObj) {
    mapObj.on('click', handler);
  }

  submitRenderHandler(handler) {
    this.form.addEventListener('submit', handler);
  }

  moveViewEventHandler(handler) {
    this.containerWorkouts.addEventListener('click', handler);
  }

  optionsRenderHandler(handler) {
    this.containerOptions.addEventListener('click', handler);
  }

  inputTypeEventHandler() {
    this.inputType.addEventListener(
      'change',
      this.toggleElevationField.bind(this)
    );
  }

  formRemoveHiddenCl() {
    this.form.classList.remove('hidden');
  }

  showForm(workout) {
    if (workout.type === 'running') {
      this.inputType.value = workout.type;
    }

    if (workout.type === 'cycling') {
      this.inputType.value = workout.type;
    }

    this.inputDistance.placeholder = `${workout.distance}`;
    this.inputDuration.placeholder = `${workout.duration}`;
    this.inputCadence.placeholder = `${workout.cadence}`;
    this.inputElevation.placeholder = `${workout.elevationGain}`;

    this.formRemoveHiddenCl();
  }

  resetForm() {
    setTimeout(() => {
      this.inputDistance.placeholder = 'km';
      this.inputDuration.placeholder = 'min';
      this.inputCadence.placeholder = 'step/min';
      this.inputElevation.placeholder = 'meters';
    }, 500);
  }

  HideForm() {
    // Empty inputs
    this.inputDistance.value =
      this.inputDuration.value =
      this.inputCadence.value =
      this.inputElevation.value =
        '';
    // cancels out any transition no css
    this.form.style.display = 'none';
    this.form.classList.add('hidden');
    setTimeout(() => (this.form.style.display = 'grid'), 250);
  }

  toggleElevationField() {
    this.inputElevation
      .closest('.form__row')
      .classList.toggle('form__row--hidden');

    this.inputCadence
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
  }

  renderInputField(workout) {
    this.inputType.value = workout.type;
    const inputType = this.inputType.value;

    if (inputType === 'running') {
      this.inputCadence
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      this.inputElevation
        .closest('.form__row')
        .classList.add('form__row--hidden');
    }

    if (inputType === 'cycling') {
      this.inputCadence
        .closest('.form__row')
        .classList.add('form__row--hidden');
      this.inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
    }
  }

  renderPopup(workout, marker) {
    // Display popup text
    marker
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴'} ${workout.description}`
      )
      .openPopup();
  }

  renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${
      workout.id
    }" aria-selected="false">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃' : '🚴'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
    `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
    `;

    this.form.insertAdjacentHTML('afterend', html);
  }

  renderOptions() {
    this.containerOptions.classList.remove('hidden');
  }

  renderCancelOption() {
    this.containerOptions.querySelector('options__cancel').style.opacity = 1;
  }

  workoutSelected(workout) {
    this.containerWorkouts.querySelectorAll('.workout').forEach(work => {
      work.setAttribute('aria-selected', false);

      if (workout.getAttribute('aria-selected') !== 'true') {
        workout.setAttribute('aria-selected', true);
      }
    });
  }

  renderCancelBtn() {
    this.containerOptions
      .querySelector('.options__cancel')
      .classList.add('active');
  }

  removeCancelBtn() {
    this.containerOptions
      .querySelector('.options__cancel')
      .classList.remove('active');
  }

  cancelCreateMode(map, marker) {
    this.HideForm();
    map.removeLayer(marker);
    this.removeCancelBtn();
  }

  hideCurrentWorkout(workoutEl) {
    workoutEl.classList.add('hidden');
  }

  optionsDefault(workoutEl, editMode) {
    this.containerOptions.classList.add('hidden');

    this.containerWorkouts.querySelectorAll('.workout').forEach(work => {
      work.setAttribute('aria-selected', false);
    });

    if (!editMode) {
      this.HideForm();

      workoutEl.classList.remove('hidden');
    }
  }

  setModalActive(isActive, map, handler) {
    if (isActive) {
      this.modal.classList.add('active');
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      map.touchZoom.disable();
      map.off('click');
    } else {
      this.modal.classList.remove('active');
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      map.touchZoom.enable();
      this.viewRenderHandler(handler, map);
    }
  }
}
