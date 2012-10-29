<?php
/**
 * @file 
 * Admin forms for the Backbone module.
 */

/**
 * Settings form for the Backbone module.
 *
 * Delegates default value to _backbone_variable_get, where default values
 * for all the module's variables are managed.
 *
 * @todo Add conditional inclusion by path setting.
 * 
 * @access public
 * @return Array
 *   Form API array, prepared by system_settings_form.
 */
function backbone_settings_form() {
  $form = array();
  $form['backbone_endpoint'] = array(
    '#type' => 'textfield',
    '#title' => t('Path to REST Endpoint'),
    '#description' => t('This should be the "Path to endpoint" setting for the REST Service you have set up on the services page.  If you are using the Backbone Base feature, this should be "/backbone/rest".'),
    '#default_value' => _backbone_variable_get('endpoint'),
  );
  return system_settings_form($form);
}
?>
