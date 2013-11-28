<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : install.rdf.xsl
    Created on : January 23, 2009, 11:44 AM
    Author     : alex
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:em="http://www.mozilla.org/2004/em-rdf#">
<xsl:output method="xml"/>
<xsl:param name="product.name"/>
<xsl:param name="version.major"/>
<xsl:param name="version.minor"/>
<xsl:param name="version.release"/>
<xsl:param name="version.build"/>

<xsl:template match="em:name">
   <em:name><xsl:value-of select="$product.name"/></em:name>
</xsl:template>

<xsl:template match="em:version">
   <em:version><xsl:value-of select="$version.major"/>.<xsl:value-of select="$version.minor"/>.<xsl:value-of select="number($version.release)+1000"/><xsl:value-of select="$version.build"/></em:version>
</xsl:template>

<xsl:template match="@*|node()">
   <xsl:copy><xsl:apply-templates select="@*|node()"/></xsl:copy>
</xsl:template>

</xsl:stylesheet>
