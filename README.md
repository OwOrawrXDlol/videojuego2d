# Instituto Tecnológico de Pachuca
## Ingeniería en Sistemas Computacionales
### Graficación
### 2do. Seguimiento

## Super Mario Galaxy – Luma Feeder

### Contexto
Este proyecto es parte parte de la evaluación de las **Unidades III y IV** (segun el PDF). El entorno de desarrollo se centra en la creación de escenarios 2D funcionales dentro de un sitio web, integrando lógica de programación, matemáticas aplicadas a la física de videojuegos y control de versiones mediante Git y GitHub.

### Objetivo
El objetivo es desarrollar un videojuego 2D interactivo aplicando la **API Canvas** de HTML5 que cumpla con reglas de negocio específicas sobre desplazamiento, colisiones aleatorias, interactividad y diseño responsivo. Haciento uso dde Git y GitHub para el control de versiones.

### Justificación
La elección de la temática de **Super Mario Galaxy** permite explorar conceptos avanzados de graficación y cinemática:
* **Física de Partículas:** Implementación de colisiones elásticas que evitan el solapamiento de objetos, proporcionando un movimiento fluido y realista.
* **Trayectorias Complejas:** Uso de funciones trigonométricas para generar movimientos circulares y ondulatorios, simulando el vuelo espacial de las Lumas.
* **Experiencia de Usuario (UX):** Integración de retroalimentación visual (partículas y destellos) y auditiva (muy buena  música de fondo) para una mayor inmersión.
* **Diseño Moderno:** Uso de **Bootstrap 5** para garantizar una distribución gráfica limpia y organizada en secciones de Header, Main y Footer.

Además es un videojuego que me gusta mucho, el juego de la página web no se despega mucho de una mecanica que realmente se encuentra en el videojuego de Nintendo, logrando una mayor inmersión. 

### Operación del Videojuego
1.  **Inicio:** Al cargar la página, se generan automáticamente **25 Lumas** con imágenes, tamaños y velocidades aleatorias.
2.  **Interacción:** El jugador debe utilizar el puntero del mouse (con un puntero personalizado tipo *Star Pointer*) para hacer clic sobre las Lumas.
3.  **Lógica de Reemplazo:** Al ser "alimentada" (cliquear una Luma), la Luma desaparece y reaparece instantáneamente en una posición aleatoria del lienzo para mantener siempre la población de 25 objetos.
4.  **Movimiento y Colisiones:**
    * Los objetos se mueven en direcciones verticales, horizontales, diagonales y circulares/espirales.
    * Al chocar entre sí o con los bordes del canvas, las Lumas rebotan elásticamente y emiten un breve destello visual.
5.  **Puntuación:** Hay un contador en la parte superior que registra en tiempo real el número de Lumas alimentadas (cliqueadas).
6.  **Instrucciones:** El usuario puede consultar la lógica del juego en cualquier momento mediante un panel de instrucciones optimizado para ocupar poco espacio.

### Conclusiones
El desarrollo de este proyecto permitió aplicar de manera práctica los conocimientos de **programación orientada a objetos** en un entorno gráfico, se logro implementar de manera efectiva el API Canvas para el desarrollo 2D. La mayor complejidad técnica radicó en la resolución de colisiones para evitar que los objetos se "teletransportaran" o quedaran atrapados, lo cual se solucionó mediante el cálculo de distancias euclidianas y vectores de separación. El resultado es una aplicación WebGL/Canvas sólida que demuestra la capacidad de integrar lógica matemática, diseño web y gestión de activos multimedia de forma eficiente.

---
#### **Alumno:** Donovan Hernández Hernández
#### **Número de Control:** 23200846
#### **Profesor:** M.T.I. Luis Alejandro Santana Valadez 
#### **Fecha:** 15 de abril de 2026

