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


async function fetchData(url, outputId) {
    try {
        const response = await fetch(`https://guitar-salmon.onrender.com${url}`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const message = data.message.replace(/\n/g, '<br>');

        const outputElement = document.getElementById(outputId);
        if (outputElement) {
            outputElement.innerHTML = message;
        } else {
            console.error("Error: output element not found");
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        const outputElement = document.getElementById(outputId);
        if (outputElement) {
            outputElement.innerHTML = "Error loading content.";
        }
    }
}

