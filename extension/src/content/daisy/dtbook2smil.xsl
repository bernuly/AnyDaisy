<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : dtbook2smil.xsl
    Created on : January 16, 2009, 9:48 AM
    Author     : alex
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:d="http://www.daisy.org/z3986/2005/dtbook/" xmlns="http://www.w3.org/2001/SMIL20/">
<xsl:output method="xml" doctype-public="-//NISO//DTD dtbsmil 2005-2//EN" doctype-system="http://www.daisy.org/z3986/2005/dtbsmil-2005-2.dtd" indent="yes"/>
<xsl:param name="base-uri"/>

<xsl:template match="d:dtbook">
<smil xmlns="http://www.w3.org/2001/SMIL20/" xml:lang="en">
<head>
<meta name="dtb:uid" content="{/d:dtbook/d:head/d:meta[@name='dtb:uid']/@content}" />
<meta name="dtb:generator" content="XSLT" />
<meta name="dtb:totalElapsedTime" content="00:00:00" />
<customAttributes>
  <customTest id="pagenum" defaultState="true" override="visible" />
</customAttributes>
</head>
<body>
   <seq id="main">
      <xsl:apply-templates select="d:book"/>
   </seq>
</body>
</smil>
</xsl:template>

<xsl:template name="id">
   <xsl:choose>
      <xsl:when test="@id"><xsl:copy-of select="@id"/></xsl:when>
      <xsl:otherwise><xsl:attribute name="id"><xsl:value-of select="generate-id()"/></xsl:attribute></xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template name="src">
   <xsl:choose>
      <xsl:when test="@id"><xsl:attribute name="src"><xsl:value-of select="$base-uri"/>#<xsl:value-of select="@id"/></xsl:attribute></xsl:when>
      <xsl:otherwise><xsl:attribute name="src"><xsl:value-of select="$base-uri"/>#<xsl:value-of select="generate-id()"/></xsl:attribute></xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template name="end.matter">
   <xsl:for-each select="d:level1[position()=last()]">
   <xsl:choose>
      <xsl:when test="@id"><xsl:attribute name="end">DTBuserEscape;<xsl:value-of select="@id"/>.end</xsl:attribute></xsl:when>
      <xsl:otherwise><xsl:attribute name="end">DTBuserEscape;<xsl:value-of select="generate-id()"/>.end</xsl:attribute></xsl:otherwise>
   </xsl:choose>
   </xsl:for-each>
</xsl:template>

<xsl:template name="end.level">
   <xsl:for-each select="*[position()=last()]">
   <xsl:choose>
      <xsl:when test="@id"><xsl:attribute name="end">DTBuserEscape;<xsl:value-of select="@id"/>.end</xsl:attribute></xsl:when>
      <xsl:otherwise><xsl:attribute name="end">DTBuserEscape;<xsl:value-of select="generate-id()"/>.end</xsl:attribute></xsl:otherwise>
   </xsl:choose>
   </xsl:for-each>
</xsl:template>

<xsl:template match="d:frontmatter|d:bodymatter|d:rearmatter">
<seq id="{local-name()}" fill="remove">
   <xsl:call-template name="end.matter"/>
   <xsl:apply-templates/>
</seq>
</xsl:template>

<xsl:template match="d:doctitle">
   <seq>
      <xsl:call-template name="id"/>
      <text><xsl:call-template name="src"/></text>
   </seq>
</xsl:template>

<xsl:template match="d:level1|d:level2">
<seq fill="remove">
   <xsl:call-template name="id"/>
   <xsl:call-template name="end.level"/>
   <xsl:apply-templates/>
</seq>
</xsl:template>

<xsl:template match="d:pagenum">
   <seq customTest="pagenum" class="{local-name()}">
      <xsl:call-template name="id"/>
      <text><xsl:call-template name="src"/></text>
   </seq>
</xsl:template>

<xsl:template match="d:h1|d:h2|d:h3|d:h4|d:h5|d:sent">
   <seq class="{local-name()}">
      <xsl:call-template name="id"/>
      <text><xsl:call-template name="src"/></text>
   </seq>
</xsl:template>

<xsl:template match="d:table|d:tr|d:th|d:td">
   <seq class="{local-name()}">
      <xsl:call-template name="id"/>
      <xsl:apply-templates/>
   </seq>
</xsl:template>

<xsl:template match="d:imggroup|d:prodnote">
   <seq class="{local-name()}">
      <xsl:call-template name="id"/>
      <xsl:apply-templates/>
   </seq>
</xsl:template>

<xsl:template match="d:img">
   <seq class="{local-name()}">
      <xsl:call-template name="id"/>
      <img src="{@src}"/>
   </seq>
</xsl:template>

<xsl:template match="d:p">
   <seq class="{local-name()}">
      <xsl:call-template name="id"/>
      <xsl:choose>
         <xsl:when test="d:sent">
            <xsl:apply-templates/>
         </xsl:when>
         <xsl:otherwise>
            <text><xsl:call-template name="src"/></text>
         </xsl:otherwise>
      </xsl:choose>
   </seq>
</xsl:template>

<xsl:template match="text()"/>

</xsl:stylesheet>
