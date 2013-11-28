<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : replace-product-name.xsl
    Created on : May 22, 2009, 12:05 PM
    Author     : alex
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
                xmlns:opf="http://openebook.org/namespaces/oeb-package/1.0/"
                xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:d="http://www.daisy.org/z3986/2005/dtbook/">

<xsl:param name="number"/>
<xsl:output method="xml"/>

<xsl:template match="dc:Title">
<dc:Title>Test <xsl:value-of select="$number"/></dc:Title>
</xsl:template>

<xsl:template match="opf:item[@id='opf']">
<xsl:copy>
<xsl:copy-of select="@id"/>
<xsl:copy-of select="@media-type"/>
<xsl:attribute name="href">test-<xsl:value-of select="$number"/>.opf</xsl:attribute>
</xsl:copy>
</xsl:template>

<xsl:template match="opf:item[@id='xml']">
<xsl:copy>
<xsl:copy-of select="@id"/>
<xsl:copy-of select="@media-type"/>
<xsl:attribute name="href">test-<xsl:value-of select="$number"/>.xml</xsl:attribute>
</xsl:copy>
</xsl:template>

<xsl:template match="opf:item[@id='ncx']">
<xsl:copy>
<xsl:copy-of select="@id"/>
<xsl:copy-of select="@media-type"/>
<xsl:attribute name="href">test-<xsl:value-of select="$number"/>.ncx</xsl:attribute>
</xsl:copy>
</xsl:template>

<xsl:template match="opf:item[@id='smil']">
<xsl:copy>
<xsl:copy-of select="@id"/>
<xsl:copy-of select="@media-type"/>
<xsl:attribute name="href">test-<xsl:value-of select="$number"/>.smil</xsl:attribute>
</xsl:copy>
</xsl:template>

<xsl:template match="*|@*">
   <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
   </xsl:copy>
</xsl:template>

</xsl:stylesheet>
