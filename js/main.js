let productos = [];

const contenedorProductos = document.querySelector("#product-list");
const campoBusqueda = document.querySelector("#product-search");
const mensajeCarga = document.querySelector("#loading-message");

function formatearPrecio(precio) {
    return "$ " + precio;
}

function renderizarProductos(listaProductos) {
    if (listaProductos.length === 0) {
        contenedorProductos.innerHTML = `
            <p class="empty-message">
                No se encontraron productos.
            </p>
        `;
        return;
    }

    contenedorProductos.innerHTML = listaProductos.map((producto) => {
        const productoEnCarrito = carrito.find(
            (productoCarrito) => productoCarrito.id === producto.id
        );

        let cantidadEnCarrito = 0;

        if (productoEnCarrito) {
            cantidadEnCarrito = productoEnCarrito.cantidad;
        }

        let stockDisponible = producto.stock - cantidadEnCarrito;

        if (stockDisponible < 0) {
            stockDisponible = 0;
        }

        const sinStock = stockDisponible === 0;

        return `
            <article class="product-card">
                <p class="product-category">${producto.categoria}</p>
                <h3>${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion}</p>
                <p class="product-price">${formatearPrecio(producto.precio)}</p>

                <p class="stock-status ${sinStock ? "out-of-stock" : ""}">
                    ${sinStock
                ? "Sin stock disponible"
                : `Stock disponible: ${stockDisponible} unidades`}
                </p>

                <button
                    class="button button-primary"
                    type="button"
                    data-product-id="${producto.id}"
                    ${sinStock ? "disabled" : ""}
                >
                    ${sinStock ? "Sin stock" : "Agregar al carrito"}
                </button>
            </article>
        `;
    }).join("");
}

async function cargarProductos() {
    try {
        const respuesta = await fetch("data/productos.json");

        if (!respuesta.ok) {
            contenedorProductos.innerHTML = `
        <p class="empty-message">
            No se pudieron cargar los productos.
        </p>
    `;
            return;
        }

        const datos = await respuesta.json();
        if (!Array.isArray(datos)) {
            contenedorProductos.innerHTML = `
        <p class="empty-message">
            El archivo de productos no tiene un formato válido.
        </p>
    `;
            return;
        }

        for (const producto of datos) {
            if (
                typeof producto.id !== "number" ||
                typeof producto.nombre !== "string" ||
                typeof producto.descripcion !== "string" ||
                typeof producto.categoria !== "string" ||
                typeof producto.precio !== "number" ||
                producto.precio < 0 ||
                typeof producto.stock !== "number" ||
                producto.stock < 0
            ) {
                contenedorProductos.innerHTML = `
        <p class="empty-message">
            El archivo de productos contiene datos inválidos.
        </p>
    `;
                return;
            }
        }

        productos = datos;
        filtrarProductos();
    } catch (error) {
        contenedorProductos.innerHTML = `
            <p class="empty-message">
                No se pudieron cargar los productos.
                Verificá los archivos y ejecutá el proyecto con un servidor local.
            </p>
        `;
    } finally {
        mensajeCarga.hidden = true;
    }
}

function filtrarProductos() {
    const terminoBusqueda = campoBusqueda.value.trim().toLowerCase();

    const productosFiltrados = productos.filter((producto) => {
        const textoProducto = `
            ${producto.nombre}
            ${producto.descripcion}
            ${producto.categoria}
        `.toLowerCase();

        return textoProducto.includes(terminoBusqueda);
    });

    renderizarProductos(productosFiltrados);
}

contenedorProductos.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-product-id]");

    if (!boton || boton.disabled) {
        return;
    }

    const idProducto = Number(boton.dataset.productId);

    const productoSeleccionado = productos.find(
        (producto) => producto.id === idProducto
    );

    if (!productoSeleccionado) {
        return;
    }

    const agregado = agregarAlCarrito(productoSeleccionado);

    if (agregado) {
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Producto agregado al carrito",
            showConfirmButton: false,
            timer: 1800
        });
    } else {
        Swal.fire({
            icon: "warning",
            title: "Sin stock disponible",
            text: "No quedan más unidades disponibles de este producto.",
            confirmButtonText: "Aceptar"
        });
    }
});

campoBusqueda.addEventListener("input", filtrarProductos);

document.querySelector("#checkout-button").addEventListener("click", async () => {
    if (carrito.length === 0) {
        return;
    }

    const totalCompra = carrito.reduce(
        (total, producto) => total + producto.precio * producto.cantidad,
        0
    );

    const resultado = await Swal.fire({
        title: "¿Confirmar compra?",
        text: `El total de tu compra es ${formatearPrecio(totalCompra)}.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Confirmar compra",
        cancelButtonText: "Seguir comprando",
        reverseButtons: true
    });

    if (!resultado.isConfirmed) {
        return;
    }

    vaciarCarrito();

    await Swal.fire({
        title: "¡Compra confirmada!",
        text: "La compra se realizó correctamente. Gracias por elegir TecnoShop.",
        icon: "success",
        confirmButtonText: "Aceptar"
    });
});

renderizarCarrito();
cargarProductos();