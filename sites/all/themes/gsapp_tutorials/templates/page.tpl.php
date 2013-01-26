<?php 
  global $user;
  if( in_array("administrator", $user->roles) ){
    $admin = true;
  }else{
    $admin = false;
  }

  if( in_array("faculty", $user->roles) ){
    $faculty = true;
  }else{
    $faculty = false;
  }

  if( in_array("ta", $user->roles) ){
    $ta = true;
  }else{
    $ta = false;
  }

  if( in_array("student", $user->roles) ){
    $student = true;
  }else{
    $student = false;
  }
?>

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
    		  <img src="/sites/all/themes/gsapp_tutorials/assets/GSAPP_COURSES.png" alt="<?php print t('Home'); ?>" />
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
      	  
      		<?php //if ($search): ?>
      		  <?php //if ($search): print render($search); endif; ?>
      		<?php //endif; ?>
      		
      		<?php //if ($secondary_nav): ?>
      		  <?php //print $secondary_nav; ?>
      		<?php //endif; ?>


          <div id="user-menu" class="pull-right btn-group">
            <a class="btn btn-success dropdown-toggle" data-toggle="dropdown" href="#">User menu<span class="caret"></span></a>
            <ul class="dropdown-menu">
              <?php if(user_is_logged_in()){ ?>
                <?php if($admin != true){ ?>
                  <li class="menu-2 first">
                    <a href="/user/<?php print $user->uid; ?>/edit">My account</a>
                  </li>
                <?php } ?>
                <?php if($student == true || $ta == true){ ?>
                  <li class="menu-3">
                    <a href="/courses/student/<?php print $user->uid; ?>">My courses</a>
                  </li>
                <?php }else if($ta == true){ ?>
                  <li class="menu-4">
                    <a href="/courses/ta/<?php print $user->uid; ?>">Courses I TA</a>
                  </li>
                <?php }else if($faculty == true){ ?>
                  <li class="menu-4">
                    <a href="/courses/faculty/<?php print $user->uid; ?>">Courses I teach</a>
                  </li>
                <?php } ?>
                <li class="menu-15 last">
                  <a href="/user/logout">Log out</a>
                </li>
              <?php }else{ ?>
                 <li class="menu-15 last">
                  <a href="/user/login">Login</a>
                </li>
              <?php } ?>
            </ul>
          </div>
    		</nav>
  	  </div>         
  	</div>
  </div>
</nav>

<div id="wrapper" class="container-fluid">
  <div class="row-fluid">
    <?php print $messages; ?>
  </div>

  <?php if($admin){ ?>
  <div class="row-fluid">
    <section class="<?php print _twitter_bootstrap_content_span(1); ?>">  
      <?php print $messages; ?>
      <?php if ($tabs): ?>
        <?php //print render($tabs); ?>
      <?php endif; ?>
      <?php if ($page['help']): ?> 
        <div class="brick"><?php print render($page['help']); ?></div>
      <?php endif; ?>

      <?php //if ($breadcrumb): print $breadcrumb; endif;?>
      <?php if ($action_links): ?>
        <ul class="action-links"><?php print render($action_links); ?></ul>
      <?php endif; ?>
    </section>
  </div>
  <?php } ?>

  <div class="row-fluid">
    <a id="main-content"></a>      
    <?php print render($page['content']); ?>
  </div><!-- /.row-fluid -->
</div><!-- /.container-fluid -->

<footer class="footer">
  <div class="container-fluid">
    <?php print render($page['footer']); ?>
  </div>
</footer>


	

