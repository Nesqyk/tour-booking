/**
 * Customer Dashboard - UI Controller
 * Handles DOM manipulation, event handling, and state management for customer dashboard
 * Provides a seamless, no-reload user experience
 */

const CustomerDashboard = (() => {
    // =========================================
    // STATE MANAGEMENT
    // =========================================
    
    let state = {
        user: null,
        customer: null,
        bookings: [],
        tours: [],
        stats: {
            totalBookings: 0,
            upcomingBookings: 0,
            totalSpent: 0,
            pendingPayments: 0
        },
        filters: {
            status: '',
            search: ''
        },
        pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalPages: 1,
            totalItems: 0
        },
        currentBookingId: null,
        isLoading: false,
        sidebarCollapsed: false
    };
    
    // =========================================
    // DOM ELEMENTS
    // =========================================
    
    const elements = {
        // User info
        userEmail: document.getElementById('userEmail'),
        logoutBtn: document.getElementById('logoutBtn'),
        viewProfileBtn: document.getElementById('viewProfileBtn'),
        viewProfileBtnHeader: document.getElementById('viewProfileBtnHeader'),
        
        // Stats
        statTotalBookings: document.getElementById('statTotalBookings'),
        statUpcomingBookings: document.getElementById('statUpcomingBookings'),
        statTotalSpent: document.getElementById('statTotalSpent'),
        statPendingPayments: document.getElementById('statPendingPayments'),
        
        // Table
        bookingsTableBody: document.getElementById('bookingsTableBody'),
        tableLoading: document.getElementById('tableLoading'),
        emptyState: document.getElementById('emptyState'),
        
        // Pagination
        paginationContainer: document.getElementById('paginationContainer'),
        paginationInfo: document.getElementById('paginationInfo'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        pageNumbers: document.getElementById('pageNumbers'),
        
        // Filters
        searchInput: document.getElementById('searchInput'),
        statusFilter: document.getElementById('statusFilter'),
        
        // Tours
        availableTours: document.getElementById('availableTours'),
        
        // Buttons
        newBookingBtn: document.getElementById('newBookingBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        saveBookingBtn: document.getElementById('saveBookingBtn'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        confirmCancelBtn: document.getElementById('confirmCancelBtn'),
        cancelBookingBtn: document.getElementById('cancelBookingBtn'),
        
        // Modals
        bookingModal: document.getElementById('bookingModal'),
        bookingModalLabel: document.getElementById('bookingModalLabel'),
        bookingForm: document.getElementById('bookingForm'),
        bookingDetailsModal: document.getElementById('bookingDetailsModal'),
        bookingDetailsModalLabel: document.getElementById('bookingDetailsModalLabel'),
        bookingDetailsBody: document.getElementById('bookingDetailsBody'),
        cancelBookingModal: document.getElementById('cancelBookingModal'),
        profileModal: document.getElementById('profileModal'),
        profileForm: document.getElementById('profileForm'),
        
        // Form fields
        bookingId: document.getElementById('bookingId'),
        tourSelect: document.getElementById('tourSelect'),
        bookingDate: document.getElementById('bookingDate'),
        numGuests: document.getElementById('numGuests'),
        bookingNotes: document.getElementById('bookingNotes'),
        totalAmountDisplay: document.getElementById('totalAmountDisplay'),
        tourInfo: document.getElementById('tourInfo'),
        cancelBookingId: document.getElementById('cancelBookingId'),
        
        // Profile fields
        customerId: document.getElementById('customerId'),
        customerFirstName: document.getElementById('customerFirstName'),
        customerLastName: document.getElementById('customerLastName'),
        customerEmail: document.getElementById('customerEmail'),
        customerPhone: document.getElementById('customerPhone'),
        customerAddress: document.getElementById('customerAddress'),
        
        // Other
        currentTime: document.getElementById('currentTime'),
        todayDate: document.getElementById('todayDate'),
        greetingText: document.getElementById('greetingText'),
        toastContainer: document.getElementById('toastContainer'),
        
        // Sidebar
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        mobileMenuToggle: document.getElementById('mobileMenuToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        sidebarBookingsLink: document.getElementById('sidebarBookingsLink'),
        sidebarProfileLink: document.getElementById('sidebarProfileLink'),
        sidebarLogoutBtn: document.getElementById('sidebarLogoutBtn'),
        sidebarUserName: document.getElementById('sidebarUserName'),
        sidebarUserEmail: document.getElementById('sidebarUserEmail'),
        mainContent: document.querySelector('.main-content')
    };
    
    // Bootstrap modal instances
    let bookingModalInstance = null;
    let bookingDetailsModalInstance = null;
    let cancelBookingModalInstance = null;
    let profileModalInstance = null;
    
    // =========================================
    // INITIALIZATION
    // =========================================
    
    /**
     * Initialize the customer dashboard
     */
    async function init() {
        console.log('Customer Dashboard initializing...');
        
        // Check authentication first
        await checkAuthAndRedirect();
        
        // Initialize sidebar
        initSidebar();
        
        // Initialize Bootstrap modals
        bookingModalInstance = new bootstrap.Modal(elements.bookingModal);
        bookingDetailsModalInstance = new bootstrap.Modal(elements.bookingDetailsModal);
        cancelBookingModalInstance = new bootstrap.Modal(elements.cancelBookingModal);
        profileModalInstance = new bootstrap.Modal(elements.profileModal);
        
        // Setup event listeners
        setupEventListeners();
        
        // Update time and greeting
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Load initial data
        await loadDashboard();
        
        console.log('Customer Dashboard initialized successfully');
    }
    
    /**
     * Check authentication and redirect if needed
     */
    async function checkAuthAndRedirect() {
        try {
            const response = await API.getCurrentUser();
            if (!response.success || !response.data) {
                window.location.href = 'landing.html';
                return;
            }
            
            const user = response.data;
            
            // Check if user is a customer
            if (user.user_type !== 'customer') {
                // Admin should go to admin dashboard
                window.location.href = 'index.html';
                return;
            }
            
            state.user = user;
            elements.userEmail.textContent = user.email;
            
            // Load customer data
            await loadCustomerData();
            
            // Update sidebar user info after customer data is loaded
            if (state.user && elements.sidebarUserEmail) {
                elements.sidebarUserEmail.textContent = state.user.email;
                if (state.customer && elements.sidebarUserName) {
                    const fullName = `${state.customer.first_name || ''} ${state.customer.last_name || ''}`.trim();
                    elements.sidebarUserName.textContent = fullName || state.user.email.split('@')[0];
                } else if (elements.sidebarUserName) {
                    elements.sidebarUserName.textContent = state.user.email.split('@')[0];
                }
            }
            
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'landing.html';
        }
    }
    
    /**
     * Load customer data based on user email
     */
    async function loadCustomerData() {
        try {
            const customers = await API.fetchCustomers();
            if (customers.success && customers.data.customers) {
                // Find customer by email
                state.customer = customers.data.customers.find(
                    c => c.email === state.user.email
                );
                
                if (!state.customer) {
                    // Customer record doesn't exist, create one
                    // This will be handled by backend later
                    showToast('Customer profile not found. Please contact support.', 'error');
                }
            }
        } catch (error) {
            console.error('Failed to load customer data:', error);
        }
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Buttons
        elements.newBookingBtn.addEventListener('click', () => showBookingModal());
        elements.refreshBtn.addEventListener('click', loadDashboard);
        elements.saveBookingBtn.addEventListener('click', handleBookingSubmit);
        elements.saveProfileBtn.addEventListener('click', handleProfileSubmit);
        elements.confirmCancelBtn.addEventListener('click', handleCancelBooking);
        elements.logoutBtn.addEventListener('click', handleLogout);
        elements.viewProfileBtn.addEventListener('click', () => showProfileModal());
        elements.viewProfileBtnHeader.addEventListener('click', () => showProfileModal());
        
        // Sidebar
        if (elements.sidebarToggle) {
            elements.sidebarToggle.addEventListener('click', toggleSidebar);
        }
        if (elements.mobileMenuToggle) {
            elements.mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
        }
        if (elements.sidebarBackdrop) {
            elements.sidebarBackdrop.addEventListener('click', closeMobileSidebar);
        }
        if (elements.sidebarBookingsLink) {
            elements.sidebarBookingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToBookings();
            });
        }
        if (elements.sidebarProfileLink) {
            elements.sidebarProfileLink.addEventListener('click', (e) => {
                e.preventDefault();
                showProfileModal();
                closeMobileSidebar();
            });
        }
        if (elements.sidebarLogoutBtn) {
            elements.sidebarLogoutBtn.addEventListener('click', handleLogout);
        }
        
        // Close mobile sidebar when clicking navigation links
        const sidebarLinks = elements.sidebar?.querySelectorAll('.sidebar-menu-link');
        if (sidebarLinks) {
            sidebarLinks.forEach(link => {
                link.addEventListener('click', () => {
                    // Close mobile sidebar if open (only on mobile)
                    if (window.innerWidth < 992) {
                        closeMobileSidebar();
                    }
                });
            });
        }
        
        // Filters
        elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
        elements.statusFilter.addEventListener('change', handleFilterChange);
        
        // Form events
        elements.tourSelect.addEventListener('change', handleTourChange);
        elements.numGuests.addEventListener('input', calculateTotal);
        
        // Modal events
        elements.bookingModal.addEventListener('hidden.bs.modal', resetBookingForm);
        elements.profileModal.addEventListener('hidden.bs.modal', resetProfileForm);
        
        // Handle window resize for responsive sidebar
        window.addEventListener('resize', handleResize);
    }
    
    // =========================================
    // DATA LOADING
    // =========================================
    
    /**
     * Load all dashboard data
     */
    async function loadDashboard() {
        try {
            setLoading(true);
            
            // Load bookings and tours in parallel
            const offset = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
            const params = {
                ...state.filters,
                limit: state.pagination.itemsPerPage,
                offset: offset
            };
            
            // For now, we'll fetch all bookings and filter client-side
            // Backend will filter by customer_id later
            const [bookingsResult, toursResult] = await Promise.all([
                API.fetchBookings(params),
                API.fetchTours()
            ]);
            
            // Filter bookings by customer (client-side for now)
            let allBookings = bookingsResult.data.bookings || [];
            if (state.customer) {
                allBookings = allBookings.filter(b => b.customer_id === state.customer.id);
            }
            
            // Apply additional filters
            allBookings = applyFilters(allBookings);
            
            // Update state
            state.bookings = allBookings;
            state.tours = toursResult.data.tours.filter(t => t.status === 'active');
            
            // Calculate stats
            calculateStats();
            
            // Update pagination
            state.pagination.totalItems = allBookings.length;
            state.pagination.totalPages = Math.ceil(allBookings.length / state.pagination.itemsPerPage);
            
            // Render UI
            renderStats();
            renderBookings(state.bookings);
            renderPagination();
            renderAvailableTours(state.tours);
            populateTourSelect();
            
        } catch (error) {
            showToast('Failed to load dashboard data', 'error');
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Apply filters to bookings
     */
    function applyFilters(bookings) {
        let filtered = [...bookings];
        
        // Status filter
        if (state.filters.status) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (state.filters.status === 'upcoming') {
                filtered = filtered.filter(b => {
                    const tourStart = new Date(b.tour_start);
                    return b.booking_status === 'confirmed' && tourStart >= today;
                });
            } else if (state.filters.status === 'past') {
                filtered = filtered.filter(b => {
                    const tourEnd = new Date(b.tour_end);
                    return tourEnd < today;
                });
            } else if (state.filters.status === 'cancelled') {
                filtered = filtered.filter(b => b.booking_status === 'cancelled');
            }
        }
        
        // Search filter
        if (state.filters.search) {
            const searchLower = state.filters.search.toLowerCase();
            filtered = filtered.filter(b => 
                b.destination.toLowerCase().includes(searchLower)
            );
        }
        
        return filtered;
    }
    
    /**
     * Calculate customer statistics
     */
    function calculateStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        state.stats.totalBookings = state.bookings.length;
        
        state.stats.upcomingBookings = state.bookings.filter(b => {
            const tourStart = new Date(b.tour_start);
            return b.booking_status === 'confirmed' && tourStart >= today;
        }).length;
        
        state.stats.totalSpent = state.bookings
            .filter(b => b.payment_status === 'paid' && b.booking_status !== 'cancelled')
            .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
        
        state.stats.pendingPayments = state.bookings
            .filter(b => ['unpaid', 'partial'].includes(b.payment_status) && b.booking_status !== 'cancelled')
            .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    }
    
    // =========================================
    // RENDERING FUNCTIONS
    // =========================================
    
    /**
     * Render dashboard statistics
     */
    function renderStats() {
        elements.statTotalBookings.textContent = state.stats.totalBookings;
        elements.statUpcomingBookings.textContent = state.stats.upcomingBookings;
        elements.statTotalSpent.textContent = formatCurrency(state.stats.totalSpent);
        elements.statPendingPayments.textContent = formatCurrency(state.stats.pendingPayments);
    }
    
    /**
     * Render bookings table
     */
    function renderBookings(bookings) {
        // Apply pagination
        const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
        const endIndex = startIndex + state.pagination.itemsPerPage;
        const paginatedBookings = bookings.slice(startIndex, endIndex);
        
        if (!paginatedBookings || paginatedBookings.length === 0) {
            elements.bookingsTableBody.innerHTML = '';
            elements.emptyState.classList.remove('d-none');
            return;
        }
        
        elements.emptyState.classList.add('d-none');
        
        const html = paginatedBookings.map((booking, index) => {
            const canCancel = booking.booking_status === 'pending' || booking.booking_status === 'confirmed';
            return `
                <tr class="stagger-item" style="animation-delay: ${index * 0.05}s">
                    <td>
                        <div class="tour-cell">
                            <span class="tour-destination">${escapeHtml(booking.destination)}</span>
                        </div>
                    </td>
                    <td>
                        <span>${formatDate(booking.booking_date)}</span>
                    </td>
                    <td>
                        <span>${formatDate(booking.tour_start)} - ${formatDate(booking.tour_end)}</span>
                    </td>
                    <td>
                        <span>${booking.num_guests}</span>
                    </td>
                    <td>
                        <span class="status-badge status-${booking.booking_status}">
                            ${booking.booking_status}
                        </span>
                    </td>
                    <td>
                        <span class="payment-badge payment-${booking.payment_status}">${booking.payment_status}</span>
                    </td>
                    <td>
                        <span class="amount-cell">${formatCurrency(booking.total_amount)}</span>
                    </td>
                    <td>
                        <div class="d-flex gap-1" data-bs-theme="dark">
                            <button class="action-btn edit" onclick="CustomerDashboard.viewBookingDetails(${booking.booking_id})" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${canCancel ? `
                                <button class="action-btn delete" onclick="CustomerDashboard.showCancelModal(${booking.booking_id})" title="Cancel Booking">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        elements.bookingsTableBody.innerHTML = html;
    }
    
    /**
     * Render available tours grid
     */
    function renderAvailableTours(tours) {
        if (!tours || tours.length === 0) {
            elements.availableTours.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-calendar-x d-block mb-2" style="font-size: 2rem;"></i>
                    <small>No tours available</small>
                </div>
            `;
            return;
        }
        
        // Show first 3 tours
        const displayTours = tours.slice(0, 3);
        const html = displayTours.map((tour, index) => {
            return `
                <div class="tour-card glass-card stagger-item mb-3" style="animation-delay: ${index * 0.1}s">
                    ${tour.image_url ? `
                        <div class="tour-card-image" style="background-image: url('${escapeHtml(tour.image_url)}');"></div>
                    ` : ''}
                    <div class="tour-card-body p-3">
                        <h5 class="tour-card-title">${escapeHtml(tour.destination)}</h5>
                        <p class="tour-card-description text-muted small">${escapeHtml(tour.description || '').substring(0, 100)}...</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div>
                                <div class="text-primary fw-bold">${formatCurrency(tour.price)}</div>
                                <small class="text-muted">per person</small>
                            </div>
                            <button class="btn btn-primary-gradient btn-sm" onclick="CustomerDashboard.bookTour(${tour.id})">
                                <i class="bi bi-calendar-plus me-1"></i>Book Now
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        elements.availableTours.innerHTML = html;
    }
    
    /**
     * Render pagination
     */
    function renderPagination() {
        if (state.pagination.totalPages <= 1) {
            elements.paginationContainer.classList.add('d-none');
            return;
        }
        
        elements.paginationContainer.classList.remove('d-none');
        
        const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage + 1;
        const end = Math.min(start + state.pagination.itemsPerPage - 1, state.pagination.totalItems);
        
        elements.paginationInfo.textContent = `Showing ${start}-${end} of ${state.pagination.totalItems} bookings`;
        
        elements.prevPageBtn.disabled = state.pagination.currentPage === 1;
        elements.nextPageBtn.disabled = state.pagination.currentPage === state.pagination.totalPages;
        
        // Page numbers
        const pageNumbers = [];
        const maxPages = 5;
        let startPage = Math.max(1, state.pagination.currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(state.pagination.totalPages, startPage + maxPages - 1);
        
        if (endPage - startPage < maxPages - 1) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(`
                <button class="pagination-number ${i === state.pagination.currentPage ? 'active' : ''}" 
                        onclick="CustomerDashboard.goToPage(${i})">
                    ${i}
                </button>
            `);
        }
        
        elements.pageNumbers.innerHTML = pageNumbers.join('');
    }
    
    /**
     * Populate tour select dropdown
     */
    function populateTourSelect() {
        const tourOptions = state.tours.map(tour => 
            `<option value="${tour.id}" data-price="${tour.price}">
                ${escapeHtml(tour.destination)} - ${formatCurrency(tour.price)} per person
            </option>`
        ).join('');
        elements.tourSelect.innerHTML = '<option value="">Select a tour...</option>' + tourOptions;
    }
    
    // =========================================
    // MODAL & FORM HANDLING
    // =========================================
    
    /**
     * Show booking modal
     */
    function showBookingModal(tourId = null) {
        state.currentBookingId = null;
        elements.bookingModalLabel.innerHTML = '<i class="bi bi-calendar-plus me-2"></i>New Booking';
        elements.bookingDate.value = new Date().toISOString().split('T')[0];
        elements.numGuests.value = 1;
        elements.bookingNotes.value = '';
        
        if (tourId) {
            elements.tourSelect.value = tourId;
            handleTourChange();
        }
        
        bookingModalInstance.show();
    }
    
    /**
     * Handle tour selection change
     */
    function handleTourChange() {
        const selectedOption = elements.tourSelect.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            const tour = state.tours.find(t => t.id == selectedOption.value);
            if (tour) {
                elements.tourInfo.textContent = `Travel dates: ${formatDate(tour.start_date)} - ${formatDate(tour.end_date)}`;
                calculateTotal();
            }
        } else {
            elements.tourInfo.textContent = '';
            elements.totalAmountDisplay.textContent = '0.00';
        }
    }
    
    /**
     * Calculate total amount
     */
    function calculateTotal() {
        const selectedOption = elements.tourSelect.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            const price = parseFloat(selectedOption.dataset.price) || 0;
            const guests = parseInt(elements.numGuests.value) || 1;
            const total = (price * guests).toFixed(2);
            elements.totalAmountDisplay.textContent = total;
        } else {
            elements.totalAmountDisplay.textContent = '0.00';
        }
    }
    
    /**
     * Handle booking submission
     */
    async function handleBookingSubmit() {
        if (!elements.bookingForm.checkValidity()) {
            elements.bookingForm.reportValidity();
            return;
        }
        
        if (!state.customer) {
            showToast('Customer profile not found. Please update your profile first.', 'error');
            return;
        }
        
        const selectedTour = state.tours.find(t => t.id == elements.tourSelect.value);
        if (!selectedTour) {
            showToast('Please select a tour', 'error');
            return;
        }
        
        const data = {
            tour_id: parseInt(elements.tourSelect.value),
            customer_id: state.customer.id,
            booking_date: elements.bookingDate.value,
            num_guests: parseInt(elements.numGuests.value),
            status: 'pending',
            payment_status: 'unpaid',
            total_amount: parseFloat(elements.totalAmountDisplay.textContent),
            notes: elements.bookingNotes.value.trim()
        };
        
        try {
            elements.saveBookingBtn.disabled = true;
            elements.saveBookingBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
            
            await API.createBooking(data);
            showToast('Booking created successfully', 'success');
            
            bookingModalInstance.hide();
            await loadDashboard();
            
        } catch (error) {
            showToast(error.message || 'Failed to create booking', 'error');
            console.error('Booking creation error:', error);
        } finally {
            elements.saveBookingBtn.disabled = false;
            elements.saveBookingBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Create Booking';
        }
    }
    
    /**
     * View booking details
     */
    function viewBookingDetails(bookingId) {
        const booking = state.bookings.find(b => b.booking_id === bookingId);
        if (!booking) return;
        
        const canCancel = booking.booking_status === 'pending' || booking.booking_status === 'confirmed';
        
        elements.bookingDetailsModalLabel.innerHTML = `<i class="bi bi-info-circle me-2"></i>Booking #${booking.booking_id}`;
        elements.bookingDetailsBody.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <strong>Tour:</strong>
                    <p>${escapeHtml(booking.destination)}</p>
                </div>
                <div class="col-md-6">
                    <strong>Booking Date:</strong>
                    <p>${formatDate(booking.booking_date)}</p>
                </div>
                <div class="col-md-6">
                    <strong>Travel Dates:</strong>
                    <p>${formatDate(booking.tour_start)} - ${formatDate(booking.tour_end)}</p>
                </div>
                <div class="col-md-6">
                    <strong>Number of Guests:</strong>
                    <p>${booking.num_guests}</p>
                </div>
                <div class="col-md-6">
                    <strong>Status:</strong>
                    <p><span class="status-badge status-${booking.booking_status}">${booking.booking_status}</span></p>
                </div>
                <div class="col-md-6">
                    <strong>Payment Status:</strong>
                    <p><span class="payment-badge payment-${booking.payment_status}">${booking.payment_status}</span></p>
                </div>
                <div class="col-md-12">
                    <strong>Total Amount:</strong>
                    <p class="h5 text-primary">${formatCurrency(booking.total_amount)}</p>
                </div>
                ${booking.notes ? `
                    <div class="col-md-12">
                        <strong>Notes:</strong>
                        <p>${escapeHtml(booking.notes)}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        elements.cancelBookingBtn.classList.toggle('d-none', !canCancel);
        if (canCancel) {
            elements.cancelBookingBtn.onclick = () => showCancelModal(bookingId);
        }
        
        bookingDetailsModalInstance.show();
    }
    
    /**
     * Show cancel booking modal
     */
    function showCancelModal(bookingId) {
        elements.cancelBookingId.value = bookingId;
        cancelBookingModalInstance.show();
    }
    
    /**
     * Handle booking cancellation
     */
    async function handleCancelBooking() {
        const bookingId = elements.cancelBookingId.value;
        if (!bookingId) return;
        
        try {
            elements.confirmCancelBtn.disabled = true;
            elements.confirmCancelBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cancelling...';
            
            // Update booking status to cancelled
            await API.updateBooking(bookingId, {
                status: 'cancelled',
                payment_status: 'refunded'
            });
            
            showToast('Booking cancelled successfully', 'success');
            cancelBookingModalInstance.hide();
            bookingDetailsModalInstance.hide();
            await loadDashboard();
            
        } catch (error) {
            showToast(error.message || 'Failed to cancel booking', 'error');
            console.error('Cancel booking error:', error);
        } finally {
            elements.confirmCancelBtn.disabled = false;
            elements.confirmCancelBtn.innerHTML = '<i class="bi bi-x-lg me-2"></i>Yes, Cancel Booking';
        }
    }
    
    /**
     * Book a specific tour
     */
    function bookTour(tourId) {
        showBookingModal(tourId);
    }
    
    /**
     * Show profile modal
     */
    async function showProfileModal() {
        if (!state.customer) {
            showToast('Customer profile not found', 'error');
            return;
        }
        
        elements.customerId.value = state.customer.id;
        elements.customerFirstName.value = state.customer.first_name || '';
        elements.customerLastName.value = state.customer.last_name || '';
        elements.customerEmail.value = state.customer.email || '';
        elements.customerPhone.value = state.customer.phone || '';
        elements.customerAddress.value = state.customer.address || '';
        
        profileModalInstance.show();
    }
    
    /**
     * Handle profile submission
     */
    async function handleProfileSubmit() {
        if (!elements.profileForm.checkValidity()) {
            elements.profileForm.reportValidity();
            return;
        }
        
        const data = {
            first_name: elements.customerFirstName.value.trim(),
            last_name: elements.customerLastName.value.trim(),
            email: elements.customerEmail.value.trim(),
            phone: elements.customerPhone.value.trim(),
            address: elements.customerAddress.value.trim()
        };
        
        try {
            elements.saveProfileBtn.disabled = true;
            elements.saveProfileBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            
            await API.updateCustomer(state.customer.id, data);
            showToast('Profile updated successfully', 'success');
            
            // Reload customer data
            await loadCustomerData();
            
            // Update sidebar user info
            if (state.customer && elements.sidebarUserName) {
                const fullName = `${state.customer.first_name || ''} ${state.customer.last_name || ''}`.trim();
                elements.sidebarUserName.textContent = fullName || state.user.email.split('@')[0];
            }
            
            profileModalInstance.hide();
            
        } catch (error) {
            showToast(error.message || 'Failed to update profile', 'error');
            console.error('Profile update error:', error);
        } finally {
            elements.saveProfileBtn.disabled = false;
            elements.saveProfileBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Update Profile';
        }
    }
    
    /**
     * Handle logout
     */
    async function handleLogout() {
        try {
            await API.logout();
            window.location.href = 'landing.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'landing.html';
        }
    }
    
    // =========================================
    // SIDEBAR MANAGEMENT
    // =========================================
    
    /**
     * Initialize sidebar state
     */
    function initSidebar() {
        // Load saved state from localStorage
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            state.sidebarCollapsed = savedState === 'true';
        } else {
            // Default to expanded on first visit
            state.sidebarCollapsed = false;
        }
        
        // Apply initial state
        updateSidebarState();
        
        // Update sidebar user info
        if (state.user && elements.sidebarUserEmail) {
            elements.sidebarUserEmail.textContent = state.user.email;
            if (state.customer && elements.sidebarUserName) {
                const fullName = `${state.customer.first_name || ''} ${state.customer.last_name || ''}`.trim();
                elements.sidebarUserName.textContent = fullName || state.user.email.split('@')[0];
            } else if (elements.sidebarUserName) {
                elements.sidebarUserName.textContent = state.user.email.split('@')[0];
            }
        }
        
        // Set active navigation item
        setActiveNavigationItem('dashboard');
    }
    
    /**
     * Toggle sidebar collapsed/expanded state
     */
    function toggleSidebar() {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        updateSidebarState();
        saveSidebarState();
    }
    
    /**
     * Update sidebar visual state
     */
    function updateSidebarState() {
        if (!elements.sidebar) return;
        
        const isMobile = window.innerWidth < 992;
        
        if (isMobile) {
            // Mobile: sidebar is always full width when shown, ensure it's closed by default
            closeMobileSidebar();
            if (elements.mainContent) {
                elements.mainContent.classList.remove('main-content-with-sidebar', 'main-content-sidebar-collapsed');
            }
            return;
        }
        
        // Desktop: toggle collapsed/expanded classes
        if (state.sidebarCollapsed) {
            elements.sidebar.classList.remove('sidebar-expanded');
            elements.sidebar.classList.add('sidebar-collapsed');
            if (elements.mainContent) {
                elements.mainContent.classList.remove('main-content-with-sidebar');
                elements.mainContent.classList.add('main-content-sidebar-collapsed');
            }
        } else {
            elements.sidebar.classList.remove('sidebar-collapsed');
            elements.sidebar.classList.add('sidebar-expanded');
            if (elements.mainContent) {
                elements.mainContent.classList.remove('main-content-sidebar-collapsed');
                elements.mainContent.classList.add('main-content-with-sidebar');
            }
        }
    }
    
    /**
     * Save sidebar state to localStorage
     */
    function saveSidebarState() {
        localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed.toString());
    }
    
    /**
     * Toggle mobile sidebar
     */
    function toggleMobileSidebar() {
        if (!elements.sidebar) return;
        
        const isOpen = elements.sidebar.classList.contains('show');
        
        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    }
    
    /**
     * Open mobile sidebar
     */
    function openMobileSidebar() {
        if (!elements.sidebar || !elements.sidebarBackdrop) return;
        
        elements.sidebar.classList.add('show');
        elements.sidebarBackdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close mobile sidebar
     */
    function closeMobileSidebar() {
        if (!elements.sidebar || !elements.sidebarBackdrop) return;
        
        elements.sidebar.classList.remove('show');
        elements.sidebarBackdrop.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    /**
     * Handle window resize
     */
    function handleResize() {
        const isMobile = window.innerWidth < 992;
        
        if (isMobile) {
            // On mobile, ensure sidebar is closed and main content has no margin
            closeMobileSidebar();
            if (elements.mainContent) {
                elements.mainContent.classList.remove('main-content-with-sidebar', 'main-content-sidebar-collapsed');
            }
        } else {
            // On desktop, restore sidebar state
            updateSidebarState();
        }
    }
    
    /**
     * Set active navigation item
     */
    function setActiveNavigationItem(page) {
        if (!elements.sidebar) return;
        
        const menuLinks = elements.sidebar.querySelectorAll('.sidebar-menu-link');
        menuLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * Scroll to bookings section
     */
    function scrollToBookings() {
        const bookingsSection = document.querySelector('#bookingsTable');
        if (bookingsSection) {
            bookingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMobileSidebar();
        }
    }
    
    /**
     * Reset booking form
     */
    function resetBookingForm() {
        state.currentBookingId = null;
        elements.bookingForm.reset();
        elements.bookingId.value = '';
        elements.tourInfo.textContent = '';
        elements.totalAmountDisplay.textContent = '0.00';
        elements.numGuests.value = 1;
        elements.bookingDate.value = new Date().toISOString().split('T')[0];
    }
    
    /**
     * Reset profile form
     */
    function resetProfileForm() {
        // Form will be populated when modal opens
    }
    
    // =========================================
    // FILTER & SEARCH HANDLERS
    // =========================================
    
    /**
     * Handle search input
     */
    function handleSearch() {
        state.filters.search = elements.searchInput.value.trim();
        state.pagination.currentPage = 1;
        loadDashboard();
    }
    
    /**
     * Handle filter change
     */
    function handleFilterChange() {
        state.filters.status = elements.statusFilter.value;
        state.pagination.currentPage = 1;
        loadDashboard();
    }
    
    /**
     * Go to specific page
     */
    function goToPage(page) {
        if (page >= 1 && page <= state.pagination.totalPages) {
            state.pagination.currentPage = page;
            loadDashboard();
        }
    }
    
    // =========================================
    // UTILITY FUNCTIONS
    // =========================================
    
    /**
     * Set loading state
     */
    function setLoading(loading) {
        state.isLoading = loading;
        if (elements.tableLoading) {
            elements.tableLoading.style.display = loading ? 'flex' : 'none';
        }
    }
    
    /**
     * Update date and time display
     */
    function updateDateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        if (elements.currentTime) elements.currentTime.textContent = timeStr;
        if (elements.todayDate) elements.todayDate.textContent = dateStr;
        
        // Update greeting
        const hour = now.getHours();
        let greeting = 'Welcome back';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        if (elements.greetingText) elements.greetingText.textContent = greeting;
    }
    
    /**
     * Format currency
     */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }
    
    /**
     * Format date
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    
    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
        
        const toastHTML = `
            <div id="${toastId}" class="toast ${bgColor} text-white" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-body">
                    ${escapeHtml(message)}
                </div>
            </div>
        `;
        
        elements.toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // =========================================
    // PUBLIC API
    // =========================================
    
    return {
        init,
        viewBookingDetails,
        showCancelModal,
        bookTour,
        goToPage
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CustomerDashboard.init();
    });
} else {
    CustomerDashboard.init();
}

