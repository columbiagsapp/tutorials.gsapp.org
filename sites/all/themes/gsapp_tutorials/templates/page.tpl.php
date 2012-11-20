<nav id="navbar" role="banner" class="navbar navbar-inverse navbar-fixed-top">
  <div class="navbar-inner">
  	<div class="container-fluid">
  	  <!-- .btn-navbar is used as the toggle for collapsed navbar content -->
  	  <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
    		<span class="icon-bar"></span>
    		<span class="icon-bar"></span>
    		<span class="icon-bar"></span>
  	  </a>
  	  
  	  <?php if ($logo): ?>
    		<a class="brand" href="<?php print $front_page; ?>" title="<?php print t('Home'); ?>">
    		  <img src="<?php print $logo; ?>" alt="<?php print t('Home'); ?>" />
    		</a>
  	  <?php endif; ?>

  	  <?php if ($site_name): ?>
    		<div id="site-name-slogan">
            <p class="lead"><?php print $site_name; ?></p>
    		</div>
  	  <?php endif; ?>
  	  
  	  <div class="nav-collapse">
    	  <nav role="navigation">
      		<?php if ($primary_nav): ?>
      		  <?php print $primary_nav; ?>
      		<?php endif; ?>
      	  
      		<?php if ($search): ?>
      		  <?php if ($search): print render($search); endif; ?>
      		<?php endif; ?>
      		
      		<?php if ($secondary_nav): ?>
      		  <?php print $secondary_nav; ?>
      		<?php endif; ?>
    		</nav>
  	  </div>         
  	</div>
  </div>
</nav>


<header class="jumbotron subhead">
  <div class="container">
    <?php print render($title_prefix); ?>
    <h1><?php print $title; ?></h1>
    <?php print render($title_suffix); ?>
  </div>
</header>

<div class="container-fluid">

  <div class="row-fluid">
	    
	  <section class="<?php print _twitter_bootstrap_content_span(2); ?>">  
      <?php if ($page['highlighted']): ?>
        <div class="highlighted hero-unit"><?php print render($page['highlighted']); ?></div>
      <?php endif; ?>

      <?php print $messages; ?>
      <?php if ($tabs): ?>
        <?php print render($tabs); ?>
      <?php endif; ?>
      <?php if ($page['help']): ?> 
        <div class="brick"><?php print render($page['help']); ?></div>
      <?php endif; ?>

      <?php //if ($breadcrumb): print $breadcrumb; endif;?>
      <?php if ($action_links): ?>
        <ul class="action-links"><?php print render($action_links); ?></ul>
      <?php endif; ?>

      <a id="main-content"></a>
      

      <?php //print render( field_view_field('node', $node, 'field_video_source') ); ?>

      <?php print render($page['content']); ?>

      <?php if ($page['sidebar_first']): ?>
        <div class="row-fluid" role="complementary">
          <?php print render($page['sidebar_first']); ?>
        </div>  <!-- /#sidebar-first -->
      <?php endif; ?>
	  </section>

    <div class="span3 sidebar" role="complementary">
      <div id="sidenav" class="span3 brick nav nav-list affix-top">
        <?php if ($page['sidebar_second']): ?>
          
            <?php print render($page['sidebar_second']); ?>
          
        <?php endif; ?>  
      </div>
    </div>  <!-- /#sidebar-first -->
    

  </div>
</div>

<footer class="footer">
  <div class="container-fluid">
    <?php print render($page['footer']); ?>
  </div>
</footer>


	

