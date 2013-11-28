<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : replace-product-name.xsl
    Created on : May 22, 2009, 12:05 PM
    Author     : alex
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
                xmlns:d="http://www.daisy.org/z3986/2005/dtbook/">

<xsl:param name="product.name"/>
<xsl:output method="xml"/>

<xsl:template match="product-name">
<xsl:value-of select="$product.name"/>
</xsl:template>

<xsl:template match="d:head/d:meta[@name='dc:Title']">
   <xsl:copy>
      <xsl:copy-of select="@name"/>
      <xsl:attribute name="content"><xsl:value-of select="$product.name"/><xsl:text> </xsl:text><xsl:value-of select="@content"/></xsl:attribute>
   </xsl:copy>
</xsl:template>

<xsl:template match="*|@*">
   <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
   </xsl:copy>
</xsl:template>

</xsl:stylesheet>
