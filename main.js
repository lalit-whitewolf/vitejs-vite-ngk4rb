import './style.css';

document.addEventListener("DOMContentLoaded", () => {
  
  let queryParams = new URLSearchParams(window.location.search);
  const spinner = document.getElementById('spinner');
  const showSpinner = () => spinner.style.display = 'block';
  const hideSpinner = () => spinner.style.display = 'none';
  
  const productContainer = document.getElementById('product-list');
  const searchInput = document.getElementById('search');
  const categoryContainer = document.getElementById('categories');
  const ratingRange = document.getElementById('ratingRange');
  const ratingValue = document.getElementById('ratingValue');
  const loadMoreButton = document.getElementById('loadMore');
  const sortOrderSelect = document.getElementById('sortOrder');
  
  const totalResultsElement = document.getElementById('totalResults');
  const openFilterbutton = document.querySelector(".product-listing__open-btn");
  const filterContain = document.querySelector(".filter-section");
  const closeFilterBtn = document.querySelector(".filter-section__close");
  let products = [];
  let limit = 10;
  let allLoaded = false;
  let sortOrder = 'low-to-high';
  

  const renderShimmers = () => {
    const shimmerHTML = Array(limit).fill(`
      <div class="shimmer">
        <div class="shimmer-content">
          <div class="shimmer-title"></div>
          <div class="shimmer-price"></div>
          <div class="shimmer-category"></div>
          <div class="shimmer-rating"></div>
        </div>
      </div>
    `).join('');    
    productContainer.innerHTML = `<div class="shimmer-wrapper">${shimmerHTML}</div>`;
  };

  const updateURL = () => {
    queryParams.set("sort", sortOrder);
    queryParams.set("search", searchInput.value);
    queryParams.set("rating", ratingRange.value);
    queryParams.set("category", [...categoryContainer.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value).join(","));
    window.history.replaceState({}, "", `?${queryParams.toString()}`);
  };

  const populateCategories = () => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    categoryContainer.innerHTML = uniqueCategories.map(category => `
      <label class="category-label">${category}
        <input type="checkbox" name="category" value="${category}" ${queryParams.get("category")?.includes(category) ? "checked" : ""}>
        <span class="category-label__checkmark"></span>
      </label>
    `).join('');
  };

  const renderProducts = (productsToRender) => {
    productContainer.innerHTML = productsToRender.length > 0 ? productsToRender.map(product => `
      <div class="product">
      <a class="product-link" href="/product-detail?pd=${product.id}">
      <div class="product-image-content">
        <img src="${product.image}" alt="${product.title}" class="product-image">
        </div>
      <div class="product-content">
        <h3>${product.title}</h3>
        <p>Price: $${product.price}</p>
        <p>Category: ${product.category}</p>
        <p>Rating: ${product.rating.rate} (${product.rating.count} reviews)</p>
        </div>        
        </a>
      </div>
    `).join('') : "No result available";
  };

  const filterProducts = () => {
    const searchText = searchInput.value.toLowerCase();
    const selectedCategories = [...categoryContainer.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
    const maxRating = parseFloat(ratingRange.value);

    let filtered = products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchText);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const matchesRating = product.rating.rate <= maxRating;
      return matchesSearch && matchesCategory && matchesRating;
    });

    // Sort based on price before rendering
    if (sortOrder === 'low-to-high') {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else {
      filtered = filtered.sort((a, b) => b.price - a.price);
    }
    console.log("filtered",filtered);
    totalResultsElement.textContent = `Total Results: ${filtered.length}`;
    renderProducts(filtered);
  };
  const showFilter = ()=>{
    filterContain.classList.add("show");
  }
  const hideFilter = ()=>{
    filterContain.classList.remove("show");
  }

  const fetchProducts = async (loadAll = false) => {
    try {      
      renderShimmers();
      const searchQuery = queryParams.get("search") || searchInput.value;
      const sort = queryParams.get("sort") || sortOrder;
      const apiUrl = loadAll 
        ? `https://fakestoreapi.com/products?sort=${sort}`
        : `https://fakestoreapi.com/products?limit=${limit}&sort=${sort}`;
         console.log("url",apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Error fetching products: ${response.statusText}`);

      const newProducts = await response.json();
      if (loadAll) {
        products = newProducts;
        allLoaded = true;
      } else {
        products = [...products, ...newProducts];
        if (newProducts.length < limit) allLoaded = true;
      }
      console.log("products",products);
      const maxRating = Math.max(...products.map(product => product.rating.rate));
      console.log("rating",maxRating);
      ratingRange.max = maxRating;
      ratingRange.value = queryParams.get("rating") || maxRating;
      ratingValue.textContent = `0 - ${ratingRange.value}`;
      searchInput.value = searchQuery;
      populateCategories();
      filterProducts();
      updateURL();
    } catch (error) {
      console.error("Error fetching products:", error);
      productContainer.innerHTML = "<p>Failed to load products. Please try again later.</p>";
    } 
  };

  const resetProducts = () => {
    products = [];
    allLoaded = false;
    fetchProducts();
  };
  const debounce = (func, delay) => {
    let timeout;   
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };
  // Event listeners
  searchInput.addEventListener("input", debounce(() => {
    filterProducts();
    updateURL();
  }, 300));

  categoryContainer.addEventListener("change", () => {
    filterProducts();
    updateURL();
  },);

  ratingRange.addEventListener("input", () => {
    ratingValue.textContent = `0 - ${ratingRange.value}`;
    filterProducts();
    updateURL();
  });

  sortOrderSelect.addEventListener("change", () => {
    sortOrder = sortOrderSelect.value;
    queryParams.set("sort", sortOrder);
    resetProducts();
  });

  loadMoreButton.addEventListener("click", () => {
    if (!allLoaded) {
    fetchProducts(true);
    loadMoreButton.classList.add("hide-load-more");
    }
    else{
      loadMoreButton.classList.remove("hide-load-more");
      
    }
  });
  allLoaded ? loadMoreButton.classList.add("hide-load-more") : loadMoreButton.classList.remove("hide-load-more");
  fetchProducts();
  openFilterbutton.addEventListener("click",showFilter);
  closeFilterBtn.addEventListener("click",hideFilter)

});
