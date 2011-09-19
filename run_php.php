<?php

$ARGS = $_GET;

$TMPVAR = json_decode($ARGS['data'], true);
$_GET = (isset($TMPVAR['GET']) ? $TMPVAR['GET'] : array());
$_POST = (isset($TMPVAR['POST']) ? $TMPVAR['POST'] : array());
$_COOKIE = (isset($TMPVAR['COOKIE']) ? $TMPVAR['COOKIE'] : array());

unset($TMPVAR);

$_REQUEST = array_merge($_GET, $_POST, $_COOKIE); unset($TMPVAR);

chdir($ARGS['dir']);
include($ARGS['file']);
