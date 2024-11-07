document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('#carouselExampleCaptions');
    const videos = carousel.querySelectorAll('video');

    carousel.addEventListener('slide.bs.carousel', function () {
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
    });

    carousel.addEventListener('slid.bs.carousel', function (event) {
        const activeIndex = event.to;
        const activeVideo = videos[activeIndex];

        if (activeVideo) {
            activeVideo.play();
        }
    });
});

