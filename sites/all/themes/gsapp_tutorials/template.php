<?php

function gsapp_tutorials_field__field_video_source__tutorial($variables){

  $output = '';

  // Never render the label.
  
  // Render the items.
  //$output .= '<div class="field-items"' . $variables['content_attributes'] . '>';
  foreach ($variables['items'] as $delta => $item) {
    $classes = 'field-item ' . ($delta % 2 ? 'odd' : 'even');
    $output .= '<div class="' . $classes . '"' . $variables['item_attributes'][$delta] . '>' . drupal_render($item) . '</div>';
  }
  //$output .= '</div>';

  // Render the top-level DIV.
  $output = '<div class="' . $variables['classes'] . '"' . $variables['attributes'] . '>' . $output . '</div>';

  return $output;
}

/**
 * Process variables for user-profile.tpl.php.
 *
 * The $variables array contains the following arguments:
 * - $account
 *
 * @see user-profile.tpl.php
 */
function gsapp_tutorials_preprocess_user_profile(&$variables) {
  $account = $variables['elements']['#account'];
  // Helpful $user_profile variable for templates.
  foreach (element_children($variables['elements']) as $key) {
    $variables['user_profile'][$key] = $variables['elements'][$key];
  }
  //Add mail to $user_profile variable
  $variables['user_profile']['mail'] = $account->mail;
  // Preprocess fields.
  field_attach_preprocess('user', $account, $variables['elements'], $variables);
}


/**
 * Makes jQuery UI available for all users (even not logged in)
 *
 *
 * @see http://drupal.org/node/1172846
 */
function gsapp_tutorials_preprocess_html(&$variables){
  drupal_add_library('system', 'ui');
}