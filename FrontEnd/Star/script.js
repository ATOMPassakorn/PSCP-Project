document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('#carouselExampleCaptions');
    const videos = carousel.querySelectorAll('video');

    carousel.addEventListener('slide.bs.carousel', function () {
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
    });

    // เล่นวิดีโอในสไลด์ที่แอคทีฟ
    carousel.addEventListener('slid.bs.carousel', function (event) {
        const activeIndex = event.to;
        const activeVideo = videos[activeIndex];

        if (activeVideo) {
            activeVideo.play();
        }
    });
});


async function fetchData() {
    try {
        
        const response = await fetch('http://127.0.0.1:5000/get_data');

        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        const message = data.message.replace(/\n/g, '<br>');

        document.getElementById('output').innerHTML = message;

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('output').innerHTML = "";
    }
}
