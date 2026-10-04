<?php
/**
 * Prepara las fotos de artistas para la seccion de roster.
 * Uso: php prepare-artists.php
 *
 * Los PNG de origen son miniaturas de 360x309 px, insuficiente para una
 * tarjeta de 4:5 en pantallas retina. Por eso se usan los originales en
 * alta resolucion de la misma carpeta.
 *
 * Salida: 800x1000 px (4:5), JPEG progresivo, ~80 KB cada una.
 */

$src_dir = 'C:/Users/gobs/Pictures/Web Charo';
$out_dir = __DIR__ . '/assets/img/artistas';

/**
 * Busca un archivo ignorando mayusculas y tildes.
 *
 * @param string $dir  Carpeta.
 * @param string $name Nombre buscado.
 * @return string|null
 */
function find_file( $dir, $name ) {
	// Normalizar: minusculas y sin tildes, para tolerar "Corazón"/"Corazon".
	$norm = function ( $s ) {
		$s = function_exists( 'mb_strtolower' ) ? mb_strtolower( $s, 'UTF-8' ) : strtolower( $s );
		$map = array( 'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n' );
		$s = strtr( $s, $map );
		return preg_replace( '/[^a-z0-9]/', '', $s );
	};

	$target = $norm( $name );
	foreach ( glob( $dir . '/*' ) as $path ) {
		if ( $norm( basename( $path ) ) === $target ) {
			return $path;
		}
	}
	return null;
}

/**
 * Recorta a la relacion indicada, con un punto de interes focal.
 *
 * @param resource|GdImage $im  Imagen.
 * @param int   $tw    Ancho final.
 * @param int   $th    Alto final.
 * @param float $fx    Foco horizontal 0-1 (0 = izquierda, 1 = derecha).
 * @param float $fy    Foco vertical 0-1 (0 = arriba, 1 = abajo).
 */
function smart_crop( $im, $tw, $th, $fx = 0.5, $fy = 0.42 ) {
	$w = imagesx( $im );
	$h = imagesy( $im );
	$target_ratio = $tw / $th;
	$src_ratio   = $w / $h;

	if ( $src_ratio > $target_ratio ) {
		// Fuente mas ancha: recortar a los lados.
		$crop_h = $h;
		$crop_w = (int) round( $h * $target_ratio );
	} else {
		// Fuente mas alta: recortar arriba/abajo.
		$crop_w = $w;
		$crop_h = (int) round( $w / $target_ratio );
	}

	$x = (int) round( ( $w - $crop_w ) * $fx );
	$y = (int) round( ( $h - $crop_h ) * $fy );

	// No pasarse de los bordes.
	$x = max( 0, min( $x, $w - $crop_w ) );
	$y = max( 0, min( $y, $h - $crop_h ) );

	$dst = imagecreatetruecolor( $tw, $th );
	imagecopyresampled( $dst, $im, 0, 0, $x, $y, $tw, $th, $crop_w, $crop_h );
	imagedestroy( $im );
	return $dst;
}

/**
 * Ajustes suaves de contraste y saturacion para igualar las imagenes.
 */
function grade( $im ) {
	imagefilter( $im, IMG_FILTER_CONTRAST, -6 );
	imagefilter( $im, IMG_FILTER_BRIGHTNESS, 4 );
	return $im;
}

$jobs = array(
	array(
		'out'  => 'dany-mixtika.jpg',
		'file' => 'dany.jpeg',           // mismo retrato que Mixtika1.png, en alta resolucion
		'fx'   => 0.50,
		'fy'   => 0.34,                  // rostro en el tercio superior
	),
	array(
		'out'  => 'jesus-marti.jpg',
		'file' => 'jesus-hero.jpg',      // mismo retrato que Jesus Marti1.png
		'sub'  => 'hergar-agency/assets/final/',
		'fx'   => 0.50,
		'fy'   => 0.40,
	),
	array(
		'out'  => 'anora-kito.jpg',
		'file' => 'anorakito.jpeg',      // la foto de la banda
		'fx'   => 0.575,                 // desplazar a la derecha para no cortar a nadie por el borde
		'fy'   => 0.56,                  // bajar para reducir el cielo vacio
	),
	array(
		'out'  => 'corazon-inverso.jpg',
		'file' => 'Crazón Inverso.jpeg', // en disco dice "Crazon", ver nota
		'fx'   => 0.50,
		'fy'   => 0.44,                  // rostros en la parte alta del encuadre
	),
);

if ( ! is_dir( $out_dir ) ) {
	mkdir( $out_dir, 0755, true );
}

foreach ( $jobs as $job ) {
	$rel  = isset( $job['sub'] ) ? $job['sub'] : '';
	$dir  = $rel ? ( rtrim( $src_dir, '/' ) . '/' . trim( $rel, '/' ) ) : $src_dir;
	$file = find_file( $dir, $job['file'] );

	if ( ! $file ) {
		printf( "  ! %-20s no encontrado (%s)\n", $job['out'], $job['file'] );
		continue;
	}

	$im = @imagecreatefromjpeg( $file );
	if ( ! $im ) {
		printf( "  ! %-20s no se pudo leer\n", $job['out'] );
		continue;
	}

	$im = grade( $im );
	$im = smart_crop( $im, 800, 1000, $job['fx'], $job['fy'] );

	imageinterlace( $im, true ); // JPEG progresivo
	$path = $out_dir . '/' . $job['out'];
	imagejpeg( $im, $path, 80 );
	imagedestroy( $im );

	printf(
		"  + %-20s 800x1000  %5.0f KB   <- %s\n",
		$job['out'],
		filesize( $path ) / 1024,
		basename( $file )
	);
}

echo "Listo.\n";
