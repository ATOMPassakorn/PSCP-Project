let currentInput = '';
        document.addEventListener('keypress', function(event) {
            currentInput += event.key;
            if (currentInput === 'cave') {
                window.location.href = 'https://guitar-salmon.vercel.app/FrontEnd/Secret/secret.html';
            }
            if (currentInput.length > 4) {
                currentInput = '';
            }
        });