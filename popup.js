document.addEventListener('DOMContentLoaded', () => {
    const welcomeView = document.getElementById('welcomeView');
    const mainView = document.getElementById('mainView');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKeyButton');
    const balanceElement = document.getElementById('balance');
    const urlsInput = document.getElementById('urlsInput');
    const sendUrlsButton = document.getElementById('sendUrlsButton');
    const taskIdInput = document.getElementById('taskIdInput');
    const checkTaskButton = document.getElementById('checkTaskButton');
    const clearApiKeyButton = document.getElementById('clearApiKeyButton');
    const loadingView = document.getElementById('loadingView');
    const notificationView = document.getElementById('notificationView');
    const errorMessage = document.getElementById('errorMessage');
    const closeNotificationButton = document.getElementById('closeNotificationButton');


    const main = async () => {

        const data = await chrome.storage.sync.get('credentials');
        console.log(data)
        if (data.credentials) {
            const [userId, apiKey] = data.credentials.split('||');
            if (!userId || !apiKey) {
                showWelcomeView();
                return;
            }
            const request = {
                action: 'any',
                url: `/users/${userId}?api_key=${apiKey}&lang=en`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            chrome.runtime.sendMessage(request, (response) => {
                if (response.error || response.status !== 200) {
                    console.error('Error:', response.error, response.msg);
                } else {
                    balanceElement.textContent = response.data.balance;
                    showMainView();
                }
            });

        } else {
            showWelcomeView();
        }
    }


    saveApiKeyButton.addEventListener('click', (e) => {
        e.preventDefault();

        checkCredentials();
    });

    sendUrlsButton.addEventListener('click', () => {
        const urls = urlsInput.value;
        const indexationType = document.querySelector('input[name="indexationType"]:checked').value;
        
        if (!urls) {
            showNotification('Error', 'Please add URLs to index');
            return;
        }
        
        hideViews();


        chrome.storage.sync.get('credentials', (data) => {
            const [userId, apiKey] = data.credentials.split('||');
            const request = {
                action: 'any',
                url: '/tasks/new',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    links: urls,
                    user_id: userId,
                    api_key: apiKey,
                    lang: 'en',
                    searchengine: 'google',
                    se_type: indexationType
                })
            };
            chrome.runtime.sendMessage(request, (response) => {
                if (response.error) {
                    console.error('Error:', response.error);
                    showNotification('Error', response.error);
                } else {
                    if (response.status !== 201) {
                        console.error('Error:', response.msg);
                        showNotification('Error', response.msg);
                    } else {
                        console.log(JSON.stringify(response))
                        showNotification('Success', "Task was created, limits spent: " + response.data.limits_used + "<br>Task ID: " + response.data.task_id);
                    }
                }
            });
        });
    });

    checkTaskButton.addEventListener('click', () => {
        const taskId = taskIdInput.value;
        if (!taskId) {
            showNotification('Error', 'Please add task ID');
            return;
        }
        hideViews();
        chrome.storage.sync.get('credentials', (data) => {
            const [userId, apiKey] = data.credentials.split('||');

            const request = {
                action: 'any',
                url: `/tasks/${taskId}?api_key=${apiKey}&user_id=${userId}&lang=en`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // body: null
            };
            chrome.runtime.sendMessage(request, (response) => {
                if (response.error) {
                    console.error('Error:', response.error);
                    showNotification('Error', response.error);
                } else {
                    if (response.status !== 200) {
                        console.error('Error:', response.msg);
                        showNotification('Error', response.msg);
                    } else {
                        showNotification('Task ' + response.data.id, 'Current status: ' + response.data.status);
                    }
                }
            });

        });
    });

    clearApiKeyButton.addEventListener('click', () => {
        chrome.storage.sync.remove('credentials', () => {
            welcomeView.style.display = 'block';
            mainView.style.display = 'none';
        });
    });

    function checkCredentials() {
        const apiKey = apiKeyInput.value;
        const userId = userIdInput.value;

        if (!apiKey || !userId) {
            showCredentialsError('Please fill all fields');
            return;
        }

        welcomeView.style.display = 'none';

        const request = {
            action: 'any',
            url: `/users/${userId}?api_key=${apiKey}&lang=en`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // body: null
        };
        chrome.runtime.sendMessage(request, (response) => {
            if (response.error || response.status !== 200) {
                console.error('Error:', response.error, response.msg);
                showWelcomeView();
                showCredentialsError(response.msg);
            } else {
                balanceElement.textContent = response.data.balance;
                chrome.storage.sync.set({ credentials: userId + '||' + apiKey }, () => {
                    showMainView();
                });
                console.log('Response from API:', response);
            }
        });
    }

    closeNotificationButton.addEventListener('click', () => {
        showMainView();
    });

    function showNotification(header, message) {
        notificationView.style.display = 'block';
        welcomeView.style.display = 'none';
        mainView.style.display = 'none';
        notificationView.querySelector('h2').textContent = header;
        notificationView.querySelector('p').innerHTML = message
    }

    function showMainView() {
        notificationView.style.display = 'none';
        welcomeView.style.display = 'none';
        mainView.style.display = 'block';
    }

    function hideViews() {
        notificationView.style.display = 'none';
        welcomeView.style.display = 'none';
        mainView.style.display = 'none';
    }

    function showWelcomeView() {
        notificationView.style.display = 'none';
        welcomeView.style.display = 'block';
        mainView.style.display = 'none';
    }

    function showCredentialsError(errorMsg) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = errorMsg ? errorMsg : 'Invalid credentials';
    }

    main()
});