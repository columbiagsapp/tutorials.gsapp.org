   <div class="node promoted-{{ promote }}">
     <div class="header">
       <div class="title">
	 {{ title }}
       </div>
       {# Add a button element to toggle promote status #}
       <button value="Promote" class="promote-toggle">
	 {% if promote == 1 %}
	   Un-promote
	 {% else %}
	   Promote
         {% endif %}
       </button>
     </div>
   </div>
