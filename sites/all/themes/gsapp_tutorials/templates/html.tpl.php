<!DOCTYPE html>
<html lang="<?php print $language->language; ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php print $head; ?>
  <title><?php print $head_title; ?></title>
  
  <?php print $styles; ?>

  <!-- HTML5 element support for IE6-8 -->
  <!--[if lt IE 9]>
    <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
  <![endif]-->

  <!--[if IE 7]>
    <link rel="stylesheet" href="/sites/all/themes/gsapp_tutorials/css/font-awesome-ie7.min.css">
  <![endif]-->
  
  <!-- Fav and touch icons -->
  <link rel="shortcut icon" href="../assets/ico/favicon.ico">
  <link rel="apple-touch-icon-precomposed" sizes="144x144" href="../assets/ico/apple-touch-icon-144-precomposed.png">
  <link rel="apple-touch-icon-precomposed" sizes="114x114" href="../assets/ico/apple-touch-icon-114-precomposed.png">
  <link rel="apple-touch-icon-precomposed" sizes="72x72" href="../assets/ico/apple-touch-icon-72-precomposed.png">
  <link rel="apple-touch-icon-precomposed" href="../assets/ico/apple-touch-icon-57-precomposed.png">
  <script type="text/javascript" src="http://fast.fonts.com/jsapi/1d7837fd-801b-4873-8c02-3adb63c2f65f.js"></script>
</head>
<body class="<?php print $classes; print ' user-uid-'.$user->uid;
  foreach($user->roles as $key => $value){
    print ' '.$value;
  }?>" <?php print $attributes;?>>
  <?php print $page_top; ?>
  <?php print $page; ?>
  <?php print $page_bottom; ?>
  <!-- Placed at the end of the document so the pages load faster -->
  <?php print $scripts; ?>

  <img id="preloaded-preloader" class="hidden" src="/sites/all/themes/gsapp_tutorials/assets/preloader.gif" />


</body>
</html>
