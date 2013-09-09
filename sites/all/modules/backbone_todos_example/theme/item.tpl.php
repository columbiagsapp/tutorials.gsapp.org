<div class="view">
  <input class="toggle" type="checkbox" <%= node.log == 'done' ? 'checked="checked"' : '' %> />
  <label><%= node.title %></label>
  <a class="destroy"></a>
</div>
<input class="edit" type="text" value="<%= node.title %>" />
