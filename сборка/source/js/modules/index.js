const body = document.querySelector('body');
const infoSlideTemplate = document.querySelector('#info-slide').content;
const backSlideTemplate = document.querySelector('#back-slide').content;
const infoSlider = document.querySelector('.slider__content_type_front .slider__list');
const backSlider = document.querySelector('.slider__content_type_back .slider__list');
const popup = document.querySelector('.popup');
const popupContainer = document.querySelector('.popup__container');
const popupTitle = popup.querySelector('.popup__title');
const popupSubtitle = popup.querySelector('.popup__description');
const popupText = popup.querySelector('.popup__text');
const popupCloseButton = popup.querySelector('.popup__close-button');
const limit = 3;
let offset = 0;
let slideCount = 0;


// инициализация слайдеров
const swiperBack = new Swiper(".slider__content_type_back", {
  speed: 1500,
  grabCursor: false,
  effect: "creative",
  creativeEffect: {
    prev: {
      shadow: true,
      translate: ["-40%", 0, -1],
    },
    next: {
      translate: ["100%", 0, 0],
    },
  },
});
const swiper = new Swiper(".slider__content_type_front", {
  grabCursor: false,
  speed: 1500,
  allowTouchMove: false,
  effect: "fade",
  on: {
    slideNextTransitionStart: function () {
      animate(this, 'next');
      swiperBack.slideNext();
    },
    slidePrevTransitionStart: function () {
      animate(this, 'prev');
      swiperBack.slidePrev();
    },
    activeIndexChange: function (){
      if (this.realIndex === this.slides.length - 1) {
        if (this.realIndex < (slideCount - 1)) {
          offset = offset + 3;
          getSlide(limit, offset);
        }
      }
    }
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});

// анимация слайда
function animate(swiper, direction) {
  const prevSlide = swiper.slides[swiper.previousIndex];
  const currentSlide = swiper.slides[swiper.realIndex];

  if (direction === 'next') {
    gsap.to(prevSlide.querySelector('.slide__title'), { x: -200, opacity: 0, duration: 1 });
    gsap.from(currentSlide.querySelector('.slide__title'), { opacity: 0, duration: 2 });
    gsap.from(currentSlide.querySelector('.slide__title'), { duration: 1.5, x: 2000 });
  }
  else if (direction === 'prev') {
    gsap.to(currentSlide.querySelector('.slide__title'), { x: 0, opacity: 1, duration: 1 });
    gsap.to(prevSlide.querySelector('.slide__title'), { opacity: 0, duration: 1.5 });
    gsap.to(prevSlide.querySelector('.slide__title'), { duration: 1.5, x: 2000 });

    gsap.to(prevSlide.querySelector('.slide__title'), { duration: 0, delay: 1.8, clearProps: 'all' });
  }
}

// получение данных для слайдов
function getSlide (limit, offset) {
  let request = new XMLHttpRequest();

  request.open('GET', `https://private-anon-b33e6e76c6-grchhtml.apiary-mock.com/slides?limit=${limit}&offset=${offset}`);

  request.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        let infoSlides = JSON.parse(this.responseText).data;
        slideCount = JSON.parse(this.responseText).countAll;
        infoSlides.forEach(function(item) {
          insertSlide(infoSlider, createInfoSlide (item));
          insertSlide(backSlider, createBackSlide (item));
          swiper.update();
          swiperBack.update();
        })
      }
    }
  };

  request.send();
}

// подготовка слайдов
function createInfoSlide (data) {
  const slide = infoSlideTemplate.cloneNode(true);
  const slideItem = slide.querySelector('.slider__item');
  const slideTitle = slide.querySelector('.slide__title');
  const slideDescription = slide.querySelector('.slide__description');
  const slideLikeCounter = slide.querySelector('.slide__like-count');
  const slideLikeButton = slide.querySelector('.slide__like-button')

  slideItem.setAttribute('data-id', data.id);
  slideTitle.textContent = data.title;
  slideTitle.title = data.title;
  slideDescription.textContent = data.desc;
  slideDescription.title = data.desc;
  slideLikeCounter.textContent = data.likeCnt;

  const like = localStorage.getItem(data.id);
  if (like) {
    slideLikeButton.setAttribute('disabled', 'true');
  } else {
    setLikeEvent (slideLikeButton);
  }

  return slide;
}
function createBackSlide (data) {
  const slide = backSlideTemplate.cloneNode(true);
  const slideItem = slide.querySelector('.slide__image');

  if(data.imgUrl) {
    slideItem.src = data.imgUrl;
  } else {
    slideItem.src = 'img/zaglushka.jpg';
  }

  return slide;
}

// установка события на кнопку лайка
function setLikeEvent (item) {
  item.addEventListener('click', function(evt) {
    evt.preventDefault();
    let id = evt.currentTarget.closest('.slider__item').getAttribute('data-id');
    setLike(id, evt.currentTarget);
  })
}

// вставка слайдов в контейнер
function insertSlide (container, slide) {
  container.append(slide);
}

//отправка лайка на сервер
function setLike(id, button) {
  let request = new XMLHttpRequest();

  request.open('POST', `https://private-anon-b33e6e76c6-grchhtml.apiary-mock.com/slides/${id}/like`);

  request.onreadystatechange = function () {
    if (this.readyState === 4) {
      let slideTitle = document.querySelector('li[data-id = "'+ id+'"]').querySelector('.slide__title').textContent;
      popupTitle.textContent = slideTitle;
      if (this.status === 200) {
        let popupTexts = JSON.parse(this.responseText);
        button.setAttribute('disabled', 'true');
        localStorage.setItem(id, 'true');
        button.closest('.slide__like-block').querySelector('.slide__like-count').textContent++;
        popupSubtitle.textContent = popupTexts.title;
        popupText.textContent = popupTexts.desc;
        openPopup();
      } else {
        popupSubtitle.textContent = 'Тут должно быть спасибо. Но это тестовое. Так что читайте про BMW';
        popupText.textContent = 'BMW Vision Efficient Dynamics, BMW i8 — автомобиль компании BMW. Концепт-кар был представлен в 2009 году, первый серийный образец — на Франкфуртском автосалоне в сентябре 2013 года BMW Vision Efficient Dynamics представляет собой полноприводное двухдверное купе. Шасси и подвеска сделаны из алюминия, крыша и двери выполнены из поликарбоната. Коэффициент аэродинамического сопротивления 0,26.';
        openPopup();
      }
    }
  };

  request.send();
}

//открытие и закрытие попапа
function openPopup(){
  popup.classList.add('popup_opened');
  gsap.from(popupContainer, {
    y: 1500
  });
  body.classList.add('page-body_overflow');
}

function closePopup(){
  popup.classList.remove('popup_opened');
  body.classList.remove('page-body_overflow');
  gsap.to(popupContainer, {
    y: 1500,
    clearProps: 'all'
  });
}

//нажатие на оверлей
popup.addEventListener("click", (evt) => {
  if (evt.target === evt.currentTarget) {
    closePopup();
  }
});

popupCloseButton.addEventListener('click', function(){
  closePopup();
})

getSlide(3, 0);

