document.addEventListener('DOMContentLoaded', () => {
    const mainNavLinks = document.querySelectorAll('.main-nav a');
    const authNavLinks = document.querySelectorAll('.auth-nav a');
    const sections = document.querySelectorAll('.section');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResultsContainer = document.getElementById('searchResults');
    const allBookItems = document.querySelectorAll('#searchResults .book-item');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const logoutLink = document.getElementById('logoutLink');
    const mypageUsername = document.getElementById('mypageUsername');
    const mypageEmail = document.getElementById('mypageEmail');
    const subscribedBooksList = document.getElementById('subscribedBooks');
    const borrowedBooksList = document.getElementById('borrowedBooks');

    let currentUser = null;
    let users = JSON.parse(localStorage.getItem('users')) || {};

    let books = [];
    allBookItems.forEach(item => {
        const id = item.dataset.bookId;
        const title = item.querySelector('h4').textContent;
        const author = item.querySelector('p:nth-of-type(1)').textContent.replace('저자: ', '');
        const publisher = item.querySelector('p:nth-of-type(2)').textContent.replace('출판사: ', '');
        const isbn = item.querySelector('p:nth-of-type(3)').textContent.replace('ISBN: ', '');
        const available = item.querySelector('.status').dataset.status === 'available';
        const location = item.querySelector('.location-tag').textContent;
        const imageUrl = item.querySelector('img').src; // HTML에서 초기 imageUrl 가져오기

        books.push({
            id, title, author, publisher, isbn, available, location, imageUrl,
            borrowedBy: available ? null : (users['user1@example.com'] ? 'user1@example.com' : null)
        });
    });

    const storedBooks = JSON.parse(localStorage.getItem('books'));
    if (storedBooks) {
        books = storedBooks;
        books.forEach(bookData => {
            const bookItem = document.querySelector(`.book-item[data-book-id="${bookData.id}"]`);
            if (bookItem) {
                updateBookItemUI(bookItem, bookData);
            }
        });
    } else {
        localStorage.setItem('books', JSON.stringify(books));
    }

    // --- 디버깅을 위한 초기 books 배열 로깅 ---
    console.log("초기 books 배열:", books);
    // ------------------------------------------

    function initApp() {
        checkLoginStatus();
        showSection('home');
    }

    function showSection(id) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(id).classList.add('active');

        mainNavLinks.forEach(link => link.classList.remove('active'));
        const activeMainNavLink = document.querySelector(`.main-nav a[data-section="${id}"]`);
        if (activeMainNavLink) {
            activeMainNavLink.classList.add('active');
        } else if (id === 'login' || id === 'signup') {
            if (!document.querySelector('.main-nav a.active')) {
                document.querySelector('.main-nav a[data-section="home"]').classList.add('active');
            }
        }
        updateAllBookItemsUI();
        if (id === 'mypage') {
            updateMypage(); // 마이페이지로 이동할 때 항상 업데이트
        }
    }

    function checkLoginStatus() {
        const loggedInUserEmail = localStorage.getItem('loggedInUser');
        if (loggedInUserEmail && users[loggedInUserEmail]) {
            currentUser = users[loggedInUserEmail];
            loginLink.style.display = 'none';
            signupLink.style.display = 'none';
            logoutLink.style.display = 'inline-block';
            updateMypage(); // 로그인 시 마이페이지 업데이트
        } else {
            currentUser = null;
            loginLink.style.display = 'inline-block';
            signupLink.style.display = 'inline-block';
            logoutLink.style.display = 'none';
            mypageUsername.textContent = '게스트';
            mypageEmail.textContent = 'guest@example.com';
            subscribedBooksList.innerHTML = '<li class="book-item no-data">로그인 후 이용해주세요.</li>';
            borrowedBooksList.innerHTML = '<li class="book-item no-data">로그인 후 이용해주세요.</li>';
        }
        updateAllBookItemsUI();
    }

    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    function saveBooks() {
        localStorage.setItem('books', JSON.stringify(books));
    }

    function updateBookItemUI(bookItemElement, bookData) {
        const statusSpan = bookItemElement.querySelector('.status');
        const actionsDiv = bookItemElement.querySelector('.actions');

        statusSpan.textContent = bookData.available ? '대출 가능' : '대출 중';
        statusSpan.classList.remove('available', 'borrowed');
        statusSpan.classList.add(bookData.available ? 'available' : 'borrowed');
        statusSpan.dataset.status = bookData.available ? 'available' : 'borrowed';

        actionsDiv.innerHTML = '';

        const isBorrowedByCurrentUser = currentUser && bookData.borrowedBy === currentUser.email;
        const isSubscribedByCurrentUser = currentUser && currentUser.subscribedBooks && currentUser.subscribedBooks.includes(bookData.id);

        if (currentUser) {
            if (bookData.available && !isBorrowedByCurrentUser) {
                actionsDiv.innerHTML += `<button class="btn-borrow" data-action="borrow">대출하기</button>`;
            } else if (isBorrowedByCurrentUser) {
                actionsDiv.innerHTML += `<button class="btn-return" data-action="return">반납하기</button>`;
            }
            if (!isBorrowedByCurrentUser) {
                if (isSubscribedByCurrentUser) {
                    actionsDiv.innerHTML += `<button class="btn-unsubscribe" data-action="unsubscribe">구독 취소</button>`;
                } else {
                    actionsDiv.innerHTML += `<button class="btn-subscribe" data-action="subscribe">구독하기</button>`;
                }
            }
        } else {
            actionsDiv.innerHTML = `<button class="btn-primary" data-action="login-prompt">로그인 후 이용</button>`;
        }
    }

    function updateAllBookItemsUI() {
        books.forEach(bookData => {
            const bookItemElement = document.querySelector(`.book-item[data-book-id="${bookData.id}"]`);
            if (bookItemElement) {
                updateBookItemUI(bookItemElement, bookData);
            }
        });
    }

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.toLowerCase();
        allBookItems.forEach(item => {
            const title = item.querySelector('h4').textContent.toLowerCase();
            const author = item.querySelector('p:nth-of-type(1)').textContent.toLowerCase();
            const isbn = item.querySelector('p:nth-of-type(3)').textContent.toLowerCase();

            if (title.includes(query) || author.includes(query) || isbn.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (users[email] && users[email].password === password) {
            localStorage.setItem('loggedInUser', email);
            currentUser = users[email];
            alert(`${currentUser.username}님, 로그인 성공!`);
            checkLoginStatus();
            showSection('home');
        } else {
            alert('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        loginForm.reset();
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (users[email]) {
            alert('이미 존재하는 이메일입니다.');
            return;
        }

        users[email] = {
            username: username,
            email: email,
            password: password,
            subscribedBooks: [],
            borrowedBooks: []
        };
        saveUsers();
        alert('회원가입 성공! 로그인해주세요.');
        showSection('login');
        signupForm.reset();
    });

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('loggedInUser');
        alert('로그아웃 되었습니다.');
        checkLoginStatus();
        showSection('home');
    });

    function updateMypage() {
        if (currentUser) {
            mypageUsername.textContent = currentUser.username;
            mypageEmail.textContent = currentUser.email;

            subscribedBooksList.innerHTML = '';
            const userSubscribedBooks = books.filter(book => currentUser.subscribedBooks.includes(book.id));
            if (userSubscribedBooks.length === 0) {
                subscribedBooksList.innerHTML = '<li class="book-item no-data">구독 중인 책이 없습니다.</li>';
            } else {
                userSubscribedBooks.forEach(book => {
                    // --- 디버깅을 위한 이미지 URL 로깅 ---
                    console.log("마이페이지 구독 목록에 렌더링될 책:", book.title, "이미지 URL:", book.imageUrl);
                    // ------------------------------------------
                    const bookItemHtml = `
                        <li class="book-item" data-book-id="${book.id}">
                            <img src="${book.imageUrl}" alt="${book.title} 표지" onerror="this.onerror=null;this.src='https://via.placeholder.com/80x120?text=No+Image';">
                            <h4>${book.title}</h4>
                            <p><strong>저자:</strong> ${book.author}</p>
                            <p><strong>출판사:</strong> ${book.publisher}</p>
                            <p><strong>ISBN:</strong> ${book.isbn}</p>
                            <p><strong>상태:</strong> <span class="status ${book.available ? 'available' : 'borrowed'}">
                                ${book.available ? '대출 가능' : '대출 중'}
                            </span></p>
                            <p><strong>위치:</strong> <span class="location-tag">${book.location}</span></p>
                        </li>
                    `;
                    subscribedBooksList.insertAdjacentHTML('beforeend', bookItemHtml);
                });
            }

            borrowedBooksList.innerHTML = '';
            const userBorrowedBooks = books.filter(book => currentUser.borrowedBooks.includes(book.id));
            if (userBorrowedBooks.length === 0) {
                borrowedBooksList.innerHTML = '<li class="book-item no-data">대출 기록이 없습니다.</li>';
            } else {
                userBorrowedBooks.forEach(book => {
                    // --- 디버깅을 위한 이미지 URL 로깅 ---
                    console.log("마이페이지 대출 목록에 렌더링될 책:", book.title, "이미지 URL:", book.imageUrl);
                    // ------------------------------------------
                     const bookItemHtml = `
                        <li class="book-item" data-book-id="${book.id}">
                            <img src="${book.imageUrl}" alt="${book.title} 표지" onerror="this.onerror=null;this.src='https://via.placeholder.com/80x120?text=No+Image';">
                            <h4>${book.title}</h4>
                            <p><strong>저자:</strong> ${book.author}</p>
                            <p><strong>출판사:</strong> ${book.publisher}</p>
                            <p><strong>ISBN:</strong> ${book.isbn}</p>
                            <p><strong>상태:</strong> <span class="status ${book.available ? 'available' : 'borrowed'}">
                                ${book.available ? '대출 가능' : '대출 중'}
                            </span></p>
                            <p><strong>위치:</strong> <span class="location-tag">${book.location}</span></p>
                        </li>
                    `;
                    borrowedBooksList.insertAdjacentHTML('beforeend', bookItemHtml);
                });
            }
        }
    }

    searchResultsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const bookItemElement = target.closest('.book-item');

        if (!bookItemElement) return;

        const bookId = bookItemElement.dataset.bookId;
        const book = books.find(b => b.id === bookId);

        if (!book) return;

        if (target.dataset.action === 'login-prompt') {
            alert('이 기능은 로그인 후 이용할 수 있습니다.');
            showSection('login');
            return;
        }

        if (!currentUser) {
            alert('로그인 후 이용해주세요.');
            showSection('login');
            return;
        }

        switch (target.dataset.action) {
            case 'borrow':
                if (book.available) {
                    book.available = false;
                    book.borrowedBy = currentUser.email;
                    currentUser.borrowedBooks.push(book.id);
                    currentUser.subscribedBooks = currentUser.subscribedBooks.filter(id => id !== book.id);
                    saveBooks();
                    saveUsers();
                    alert(`${book.title} 도서가 대출되었습니다.`);
                    updateUI();
                } else {
                    alert('이미 대출 중인 도서입니다.');
                }
                break;
            case 'return':
                if (!book.available && book.borrowedBy === currentUser.email) {
                    book.available = true;
                    book.borrowedBy = null;
                    currentUser.borrowedBooks = currentUser.borrowedBooks.filter(id => id !== book.id);
                    saveBooks();
                    saveUsers();
                    alert(`${book.title} 도서가 반납되었습니다.`);
                    updateUI();
                    notifySubscribers(book.id);
                } else {
                    alert('이 도서는 대출하지 않았거나 이미 반납된 상태입니다.');
                }
                break;
            case 'subscribe':
                if (!currentUser.subscribedBooks.includes(book.id)) {
                    currentUser.subscribedBooks.push(book.id);
                    saveUsers();
                    alert(`${book.title} 도서의 대출 가능 알림을 구독했습니다.`);
                    updateUI();
                } else {
                    alert('이미 구독 중인 도서입니다.');
                }
                break;
            case 'unsubscribe':
                currentUser.subscribedBooks = currentUser.subscribedBooks.filter(id => id !== book.id);
                saveUsers();
                alert(`${book.title} 도서 구독을 취소했습니다.`);
                updateUI();
                break;
        }
    });

    function updateUI() {
        updateAllBookItemsUI();
        if (document.getElementById('mypage').classList.contains('active')) {
            updateMypage();
        }
    }

    function notifySubscribers(bookId) {
        console.log(`알림: ${bookId} 도서가 반납되어 구독자들에게 알림이 전송됩니다.`);
        const bookTitle = books.find(b => b.id === bookId)?.title || '알 수 없는 책';
        for (const email in users) {
            if (users[email].subscribedBooks.includes(bookId)) {
                if (currentUser && email === currentUser.email) {
                    continue;
                }
                alert(`[알림] ${users[email].username}님, 구독하신 책 "${bookTitle}"이(가) 반납되어 대출 가능합니다!`);
            }
        }
    }

    mainNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.dataset.section;

            if (targetSection === 'mypage' && !currentUser) {
                alert('마이페이지는 로그인 후 이용 가능합니다.');
                showSection('login');
                return;
            }
            showSection(targetSection);
        });
    });

    authNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.dataset.section;
            if (e.target.id === 'logoutLink') {
                return;
            }
            if (targetSection) {
                showSection(targetSection);
            }
        });
    });

    document.querySelector('.hero-content .btn-primary').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('search');
    });

    initApp();
});