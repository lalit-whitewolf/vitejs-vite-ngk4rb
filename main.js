import './style.css';

document.addEventListener("DOMContentLoaded", () => {
  const productContainer = document.getElementById('product-list');
  const searchInput = document.getElementById('search');
  const categoryContainer = document.getElementById('categories');
  const ratingRange = document.getElementById('ratingRange');
  const ratingValue = document.getElementById('ratingValue');
  const loadMoreButton = document.getElementById('loadMore');
  const sortOrderSelect = document.getElementById('sortOrder');
  const spinner = document.getElementById('spinner');
  const totalResultsElement = document.getElementById('totalResults');
  let products = [];
  let limit = 10;
  let allLoaded = false;
  let sortOrder = 'low-to-high';
  let queryParams = new URLSearchParams(window.location.search);

  const showSpinner = () => spinner.style.display = 'block';
  const hideSpinner = () => spinner.style.display = 'none';

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
      <label>
        <input type="checkbox" name="category" value="${category}" ${queryParams.get("category")?.includes(category) ? "checked" : ""}>
        ${category}
      </label>
    `).join('');
  };

  const renderProducts = (productsToRender) => {
    productContainer.innerHTML = productsToRender.length > 0 ? productsToRender.map(product => `
      <div class="product">
        <h3>${product.title}</h3>
        <p>Price: $${product.price}</p>
        <p>Category: ${product.category}</p>
        <p>Rating: ${product.rating.rate} (${product.rating.count} reviews)</p>
        <img src="${product.image}" alt="${product.title}" width="100">
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
    totalResultsElement.textContent = `Total Results: ${filtered.length}`;
    renderProducts(filtered);
  };

  const fetchProducts = async (loadAll = false) => {
    try {
      showSpinner();

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

      const maxRating = Math.max(...products.map(product => product.rating.rate));
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
    } finally {
      hideSpinner();
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
  searchInput.addEventListener("input", () => {
    filterProducts();
    updateURL();
  });

  categoryContainer.addEventListener("change", debounce(() => {
    filterProducts();
    updateURL();
  }, 300));

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
    loadMoreButton.classList.add("hide-load-more")
    }
    else{
      loadMoreButton.classList.remove("hide-load-more")
    }
  });
  allLoaded ? loadMoreButton.classList.remove("hide-load-more") : loadMoreButton.classList.add("hide-load-more");
  fetchProducts();
});
