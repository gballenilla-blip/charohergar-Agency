/* ==========================================================================
   CHAROHERGAR — Formspree
   --------------------------------------------------------------------------
   CONFIGURACION: solo tenes que rellenar FORM_ID con el identificador que
   te da Formspree al crear el formulario.

   Como obtenerlo (2 minutos, gratis):
     1. Entra en https://formspree.io y crea una cuenta
     2. "New Form" > "Classic" (o "Default")
     3. Ponle un nombre, por ejemplo "Charohergar - Contacto"
     4. En "Your Form ID" te aparecera algo como xjvqdkab
     5. Pegalo abajo en FORM_ID y listo

   Que llega adonde:
     Los mensajes se envian al email que verificas al crear la cuenta.
     Si wantés que lleguen a otro, cambialo en el panel de Formspree.
   ========================================================================== */

window.CHAROHERGAR = {
  /* El ID de tu formulario. Ejemplo: 'xjvqdkab' */
  FORM_ID: 'PEGA_AQUI_TU_ID',

  /* Email de destino. Debe coincidir con el verificado en Formspree. */
  EMAIL: 'charo@hergaragency.es',

  /* Si es true, el navegador abre el Post de Formspree en una pestaña
     nueva en vez de enviar en segundo plano. Recomendado: false. */
  NUEVA_PESTANA: false
};
