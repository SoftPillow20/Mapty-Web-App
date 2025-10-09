const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

export const formViewRenderHandler = function (handler, mapObj) {
  mapObj.on('click', handler);
};

export const formRemoveHiddenCl = function () {
  form.classList.remove('hidden');
};

export const HideForm = function () {
  // Empty inputs
  inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      '';
  // cancels out any transition no css
  form.style.display = 'none';
  form.classList.add('hidden');
  setTimeout(() => (form.style.display = 'grid'), 1000);
};
