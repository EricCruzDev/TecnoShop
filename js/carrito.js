let carrito = cargarCarrito();

function cargarCarrito() {
    try {
        const datosGuardados = localStorage.getItem("tecnoshop-carrito") || "[]";
        const productosGuardados = JSON.parse(datosGuardados);

        if (!Array.isArray(productosGuardados)) {
            return [];
        }

        const productosValidos = [];

        for (const producto of productosGuardados) {
            if (
                typeof producto.id === "number" &&
                typeof producto.nombre === "string" &&
                typeof producto.precio === "number" &&
                producto.precio >= 0 &&
                typeof producto.cantidad === "number" &&
                producto.cantidad > 0 &&
                typeof producto.stock === "number" &&
                producto.stock >= producto.cantidad
            ) {
                productosValidos.push(producto);
            }
        }

        return productosValidos;
    } catch (error) {
        return [];
    }
}

function guardarCarrito() {
    if (carrito.length === 0) {
        localStorage.removeItem("tecnoshop-carrito");
    } else {
        localStorage.setItem("tecnoshop-carrito", JSON.stringify(carrito));
    }

    renderizarCarrito();
}

function agregarAlCarrito(producto) {
    const productoExistente = carrito.find(
        (productoCarrito) => productoCarrito.id === producto.id
    );

    if (productoExistente) {
        if (productoExistente.cantidad >= producto.stock) {
            return false;
        }

        productoExistente.cantidad++;
    } else {
        if (producto.stock <= 0) {
            return false;
        }

        carrito.push({ ...producto, cantidad: 1 });
    }

    guardarCarrito();
    return true;
}

function cambiarCantidad(id, cambio) {
    const producto = carrito.find(
        (productoCarrito) => productoCarrito.id === id
    );

    if (!producto) {
        return;
    }

    if (cambio > 0 && producto.cantidad >= producto.stock) {
        return;
    }

    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        eliminarDelCarrito(id);
        return;
    }

    guardarCarrito();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(
        (producto) => producto.id !== id
    );

    guardarCarrito();
}

function vaciarCarrito() {
    carrito = [];
    localStorage.removeItem("tecnoshop-carrito");
    renderizarCarrito();
}

function renderizarCarrito() {
    const contenedorCarrito = document.querySelector("#cart-items");
    const contadorCarrito = document.querySelector("#cart-count");
    const totalCarrito = document.querySelector("#cart-total");
    const botonVaciar = document.querySelector("#clear-cart");
    const botonComprar = document.querySelector("#checkout-button");

    const cantidadTotal = carrito.reduce(
        (acumulado, producto) => acumulado + producto.cantidad,
        0
    );

    const precioTotal = carrito.reduce(
        (acumulado, producto) =>
            acumulado + producto.precio * producto.cantidad,
        0
    );

    contadorCarrito.textContent = cantidadTotal;
    totalCarrito.textContent = "$ " + precioTotal;

    botonVaciar.disabled = carrito.length === 0;
    botonComprar.disabled = carrito.length === 0;

    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = `
            <p class="empty-message">
                Tu carrito está vacío. Agregá productos para comenzar.
            </p>
        `;

        filtrarProductos();
        return;
    }

    contenedorCarrito.innerHTML = carrito.map((producto) => {
        const { id, nombre, precio, cantidad, stock } = producto;

        return `
            <article class="cart-item">
                <div>
                    <h3>${nombre}</h3>
                    <p>$ ${precio} por unidad</p>
                    <p>Unidades en carrito: ${cantidad} de ${stock}</p>
                </div>

                <div class="quantity-controls" aria-label="Cantidad de ${nombre}">
                    <button
                        class="quantity-button"
                        type="button"
                        data-action="decrease"
                        data-id="${id}"
                        aria-label="Disminuir cantidad de ${nombre}"
                    >−</button>

                    <span class="quantity-value">${cantidad}</span>

                    <button
                        class="quantity-button"
                        type="button"
                        data-action="increase"
                        data-id="${id}"
                        aria-label="Aumentar cantidad de ${nombre}"
                        ${cantidad >= stock ? "disabled" : ""}
                    >+</button>
                </div>

                <button
                    class="remove-button"
                    type="button"
                    data-action="remove"
                    data-id="${id}"
                >Eliminar</button>
            </article>
        `;
    }).join("");

    filtrarProductos();
}

document.querySelector("#cart-items").addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-action]");

    if (!boton) {
        return;
    }

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.action;

    if (accion === "increase") {
        cambiarCantidad(id, 1);
    } else if (accion === "decrease") {
        cambiarCantidad(id, -1);
    } else if (accion === "remove") {
        eliminarDelCarrito(id);
    }
});

document.querySelector("#clear-cart").addEventListener("click", () => {
    vaciarCarrito();
});